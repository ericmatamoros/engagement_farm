import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, dailyTasks, userTaskCompletions } from '@/lib/schema';
import { sql, desc, gte, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adminWallet = searchParams.get('admin_wallet');
  const range = searchParams.get('range') || '7d';

  // Verify admin access
  if (!adminWallet || adminWallet.toLowerCase() !== process.env.ADMIN_WALLET?.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Calculate date range
    let dateFilter;
    switch (range) {
      case '24h':
        dateFilter = sql`NOW() - INTERVAL '24 hours'`;
        break;
      case '7d':
        dateFilter = sql`NOW() - INTERVAL '7 days'`;
        break;
      case '30d':
        dateFilter = sql`NOW() - INTERVAL '30 days'`;
        break;
      default:
        dateFilter = null;
    }

    // Get total users
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    // Get active users (users with Twitter connected)
    const activeUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(isNotNull(users.twitterUsername));

    // Get total tasks
    const totalTasks = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailyTasks);

    // Get total completions
    const totalCompletions = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTaskCompletions);

    // Get total BONES distributed
    const totalYapsDistributed = await db
      .select({ total: sql<number>`sum(${userTaskCompletions.bonesEarned})` })
      .from(userTaskCompletions);

    // Get today's completions
    const todayCompletions = await db
      .select({ count: sql<number>`count(*)` })
      .from(userTaskCompletions)
      .where(gte(userTaskCompletions.completedAt, sql`CURRENT_DATE`));

    // Calculate weekly growth (simplified)
    const weeklyGrowth = Math.random() * 20; // Mock data - implement actual calculation

    // Get top performers
    const topPerformers = await db
      .select({
        username: users.twitterUsername,
        yaps: users.bones,
        completions: sql<number>`count(${userTaskCompletions.id})`,
      })
      .from(users)
      .leftJoin(userTaskCompletions, sql`${userTaskCompletions.userId} = ${users.id}`)
      .where(isNotNull(users.twitterUsername))
      .groupBy(users.id, users.twitterUsername, users.bones)
      .orderBy(desc(users.bones))
      .limit(5);

    const stats = {
      totalUsers: totalUsers[0]?.count || 0,
      totalTasks: totalTasks[0]?.count || 0,
      totalCompletions: totalCompletions[0]?.count || 0,
      totalYapsDistributed: totalYapsDistributed[0]?.total || 0,
      activeUsers: activeUsers[0]?.count || 0,
      todayCompletions: todayCompletions[0]?.count || 0,
      weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
      topPerformers: topPerformers.map(p => ({
        username: p.username || 'Unknown',
        yaps: p.yaps || 0,
        completions: p.completions || 0,
      })),
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
