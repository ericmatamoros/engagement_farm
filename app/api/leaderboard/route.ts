import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, invites } from '@/lib/schema';
import { desc, isNotNull, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Get leaderboard data
    const leaderboard = await db
      .select({
        rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${users.bones} DESC, ${users.createdAt} ASC)`,
        username: users.twitterUsername,
        walletAddress: users.walletAddress,
        yaps: users.bones,
        joinDate: users.createdAt,
      })
      .from(users)
      .where(isNotNull(users.twitterUsername))
      .orderBy(desc(users.bones), users.createdAt)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNotNull(users.twitterUsername));

    // Referral leaderboard (count invites by inviter wallet)
    const referralRows = await db
      .select({
        inviterWallet: invites.invitedBySignupAddress,
        refs: sql<number>`count(*)`,
      })
      .from(invites)
      .where(sql`${invites.invitedBySignupAddress} IS NOT NULL AND ${invites.invitedBySignupAddress} <> ''`)
      .groupBy(invites.invitedBySignupAddress)
      .orderBy(desc(sql`count(*)`))
      .limit(100);

    const referralLeaderboard = referralRows
      .filter((r) => !!r.inviterWallet)
      .map((r, idx) => ({ rank: idx + 1, walletAddress: r.inviterWallet as string, refs: Number(r.refs) }));

    return NextResponse.json({
      leaderboard,
      totalCount: totalCount[0]?.count || 0,
      hasMore: offset + limit < (totalCount[0]?.count || 0),
      referralLeaderboard,
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
