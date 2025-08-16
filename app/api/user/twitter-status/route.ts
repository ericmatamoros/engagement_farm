import { NextRequest, NextResponse } from 'next/server';
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
    let user = await db.select({
      twitterUsername: users.twitterUsername,
      twitterId: users.twitterId,
      yaps: users.bones,
      rank: users.rank,
      referrals: users.referredBy,
      referralCode: users.referralCode,
    }).from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        connected: false,
        message: 'User not found' 
      });
    }

    let userData = user[0];

    // Backfill referral code if missing
    if (!userData.referralCode) {
      const generated = walletAddress.replace('0x', '').slice(0, 4);
      await db
        .update(users)
        .set({ referralCode: generated, updatedAt: new Date() })
        .where(eq(users.walletAddress, walletAddress));
      userData = { ...userData, referralCode: generated } as any;
    }
    
    return NextResponse.json({
      connected: !!userData.twitterUsername,
      username: userData.twitterUsername,
      yaps: userData.yaps,
      rank: userData.rank,
      referrals: userData.referrals,
      referralCode: userData.referralCode,
    });

  } catch (error) {
    console.error('Error checking Twitter status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
