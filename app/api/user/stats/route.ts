import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userTaskCompletions, dailyTasks } from '@/lib/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Get user basic info
    const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // Get task completion stats
    const taskStats = await db
      .select({
        totalCompleted: sql<number>`count(*)`,
        totalBonesEarned: sql<number>`sum(${userTaskCompletions.bonesEarned})`,
      })
      .from(userTaskCompletions)
      .where(eq(userTaskCompletions.userId, userData.id));

    // Get weekly BONES (last 7 days)
    const weeklyStats = await db
      .select({
        weeklyBones: sql<number>`sum(${userTaskCompletions.bonesEarned})`,
      })
      .from(userTaskCompletions)
      .where(
        and(
          eq(userTaskCompletions.userId, userData.id),
          gte(userTaskCompletions.completedAt, sql`NOW() - INTERVAL '7 days'`)
        )
      );

    // Get monthly BONES (last 30 days)
    const monthlyStats = await db
      .select({
        monthlyBones: sql<number>`sum(${userTaskCompletions.bonesEarned})`,
      })
      .from(userTaskCompletions)
      .where(
        and(
          eq(userTaskCompletions.userId, userData.id),
          gte(userTaskCompletions.completedAt, sql`NOW() - INTERVAL '30 days'`)
        )
      );

    // Get total available tasks
    const totalTasks = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(dailyTasks)
      .where(eq(dailyTasks.isActive, true));

    // Count referrals
    const referralCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(eq(users.referredBy, userData.id));

    const stats = {
      totalYaps: (userData as any).bones || 0,
      rank: userData.rank || 0,
      tasksCompleted: taskStats[0]?.totalCompleted || 0,
      totalTasks: totalTasks[0]?.count || 0,
      referrals: referralCount[0]?.count || 0,
      joinDate: userData.createdAt?.toISOString() || new Date().toISOString(),
      weeklyYaps: (weeklyStats[0] as any)?.weeklyBones || 0,
      monthlyYaps: (monthlyStats[0] as any)?.monthlyBones || 0,
      completionRate: totalTasks[0]?.count ? 
        Math.round(((taskStats[0]?.totalCompleted || 0) / totalTasks[0].count) * 100) : 0,
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
