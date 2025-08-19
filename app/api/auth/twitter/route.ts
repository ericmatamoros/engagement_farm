import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
export const runtime = 'nodejs';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY;
    if (!clientId) {
      return NextResponse.json({ error: 'Missing TWITTER_CLIENT_ID' }, { status: 500 });
    }

    // PKCE: generate code_verifier and S256 code_challenge
    const codeVerifier = crypto.randomBytes(64).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const state = walletAddress; // tie to wallet address
    // In a real implementation, you would:
    // 1. Redirect to Twitter OAuth URL with proper parameters
    // 2. Handle the callback with the authorization code
    // 3. Exchange the code for access tokens
    // 4. Get user info from Twitter API
    // 5. Store the connection in the database

    const twitterAuthUrl = new URL('https://twitter.com/i/oauth2/authorize');
    const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/twitter/callback`;
    twitterAuthUrl.searchParams.set('response_type', 'code');
    twitterAuthUrl.searchParams.set('client_id', clientId);
    twitterAuthUrl.searchParams.set('redirect_uri', redirectUri);
    twitterAuthUrl.searchParams.set('scope', 'tweet.read users.read follows.read like.read offline.access');
    twitterAuthUrl.searchParams.set('state', state);
    twitterAuthUrl.searchParams.set('code_challenge', codeChallenge);
    twitterAuthUrl.searchParams.set('code_challenge_method', 'S256');

    const res = NextResponse.redirect(twitterAuthUrl.toString());
    // Store PKCE verifier and state
    const secure = process.env.NODE_ENV === 'production';
    res.cookies.set('tw_cv', codeVerifier, { httpOnly: true, secure, path: '/', sameSite: 'lax', maxAge: 600 });
    res.cookies.set('tw_state', state, { httpOnly: true, secure, path: '/', sameSite: 'lax', maxAge: 600 });
    return res;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, twitterData } = body;

    if (!walletAddress || !twitterData) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    // Check if wallet already exists
    const existingUser = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (existingUser.length > 0) {
      // Update existing user with Twitter data
      await db.update(users)
        .set({
          twitterUsername: twitterData.username,
          twitterId: twitterData.id,
          twitterAccessToken: twitterData.accessToken,
          twitterRefreshToken: twitterData.refreshToken,
          updatedAt: new Date(),
        })
        .where(eq(users.walletAddress, walletAddress));
    } else {
      // Create new user
      await db.insert(users).values({
        walletAddress,
        twitterUsername: twitterData.username,
        twitterId: twitterData.id,
        twitterAccessToken: twitterData.accessToken,
        twitterRefreshToken: twitterData.refreshToken,
        referralCode: walletAddress.slice(0, 8),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Twitter connection error:', error);
    return NextResponse.json({ error: 'Failed to connect Twitter' }, { status: 500 });
  }
}
