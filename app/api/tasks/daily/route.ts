import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyTasks, users, userTaskCompletions } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Get user ID
    const user = await db.select({ id: users.id }).from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user[0].id;

    // Get today's active tasks
    const today = new Date().toISOString().split('T')[0];
    
    const tasks = await db
      .select({
        id: dailyTasks.id,
        title: dailyTasks.title,
        shortDescription: dailyTasks.shortDescription,
        imageUrl: dailyTasks.imageUrl,
        taskType: dailyTasks.taskType,
        taskData: dailyTasks.taskData,
        bonesReward: dailyTasks.bonesReward,
        recurrenceType: dailyTasks.recurrenceType,
        completedAt: userTaskCompletions.completedAt,
        verificationStatus: userTaskCompletions.verificationStatus,
        bonesEarned: userTaskCompletions.bonesEarned,
      })
      .from(dailyTasks)
      .leftJoin(
        userTaskCompletions,
        and(
          eq(userTaskCompletions.taskId, dailyTasks.id),
          eq(userTaskCompletions.userId, userId),
          sql`DATE(${userTaskCompletions.completedAt}) = ${today}`
        )
      )
      .where(
        and(
          eq(dailyTasks.isActive, true),
          // Include tasks for today depending on recurrence type
          sql`(
            (${dailyTasks.recurrenceType} = 'single_day' AND ${dailyTasks.scheduledDate} = ${today}) OR
            (${dailyTasks.recurrenceType} = 'daily_repeat') OR
            (${dailyTasks.recurrenceType} = 'once_until_done')
          )`
        )
      );

    const formattedTasks = tasks
      // For once_until_done, hide if user has ever completed it
      .filter(task => !(task.recurrenceType === 'once_until_done' && task.completedAt))
      .map(task => ({
      id: task.id,
      title: task.title,
      shortDescription: task.shortDescription,
      imageUrl: task.imageUrl,
      taskType: task.taskType,
      taskData: task.taskData,
      bonesReward: task.bonesReward,
      isCompleted: !!task.completedAt,
      verificationStatus: task.verificationStatus,
      bonesEarned: task.bonesEarned,
    }));

    return NextResponse.json({ tasks: formattedTasks });

  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
