import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This contains the wallet address
  const error = searchParams.get('error');

  if (error) {
    // Redirect back to the main page with error
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=twitter_auth_failed`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=missing_params`);
  }

  try {
    // Validate PKCE + state from cookies
    const cookies = request.cookies;
    const storedState = cookies.get('tw_state')?.value;
    const codeVerifier = cookies.get('tw_cv')?.value;
    if (!storedState || !codeVerifier || storedState !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=invalid_state`);
    }

    // Exchange authorization code for access token
    const clientId = (process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY)!;
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    // If app is configured as Confidential, Twitter requires Basic auth
    if (process.env.TWITTER_CLIENT_SECRET) {
      headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`;
    }

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers,
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/twitter/callback`,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error('Twitter token exchange error:', tokenResponse.status, body);
      return new NextResponse(
        `Token exchange failed (status ${tokenResponse.status}).\n\n${body}`,
        { status: tokenResponse.status, headers: { 'content-type': 'text/plain; charset=utf-8' } }
      );
    }

    const tokenData = await tokenResponse.json();

    // Get user information from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const body = await userResponse.text();
      console.error('Twitter user info error:', userResponse.status, body);
      return new NextResponse(
        `User info fetch failed (status ${userResponse.status}).\n\n${body}`,
        { status: userResponse.status, headers: { 'content-type': 'text/plain; charset=utf-8' } }
      );
    }

    const userData = await userResponse.json();

    // Check if this Twitter account is already connected to another wallet
    const existingTwitterUser = await db.select()
      .from(users)
      .where(eq(users.twitterId, userData.data.id))
      .limit(1);

    if (existingTwitterUser.length > 0 && existingTwitterUser[0].walletAddress !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=twitter_already_connected`);
    }

    // Check if wallet exists
    const existingWalletUser = await db.select()
      .from(users)
      .where(eq(users.walletAddress, state))
      .limit(1);

    if (existingWalletUser.length > 0) {
      // Update existing user
      await db.update(users)
        .set({
          twitterUsername: userData.data.username,
          twitterId: userData.data.id,
          twitterAccessToken: tokenData.access_token,
          twitterRefreshToken: tokenData.refresh_token,
          updatedAt: new Date(),
        })
        .where(eq(users.walletAddress, state));
    } else {
      // Create new user
      await db.insert(users).values({
        walletAddress: state,
        twitterUsername: userData.data.username,
        twitterId: userData.data.id,
        twitterAccessToken: tokenData.access_token,
        twitterRefreshToken: tokenData.refresh_token,
        referralCode: state.replace('0x','').slice(0, 4),
      });
    }

    // Redirect back to the main page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?twitter_connected=true`);

  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}?error=twitter_connection_failed`);
  }
}
