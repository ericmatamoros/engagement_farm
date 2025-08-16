import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyTasks, userTaskCompletions } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const adminWallet = searchParams.get('admin_wallet');

  // Verify admin access
  if (!adminWallet || adminWallet.toLowerCase() !== process.env.ADMIN_WALLET?.toLowerCase()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const tasks = await db
      .select({
        id: dailyTasks.id,
        title: dailyTasks.title,
        shortDescription: dailyTasks.shortDescription,
        imageUrl: dailyTasks.imageUrl,
        taskType: dailyTasks.taskType,
        taskData: dailyTasks.taskData,
        yapsReward: dailyTasks.bonesReward,
        recurrenceType: dailyTasks.recurrenceType,
        isRecurrent: dailyTasks.isRecurrent,
        scheduledDate: dailyTasks.scheduledDate,
        isActive: dailyTasks.isActive,
        createdAt: dailyTasks.createdAt,
        completionCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${userTaskCompletions} 
          WHERE ${userTaskCompletions.taskId} = ${dailyTasks.id}
        )`,
      })
      .from(dailyTasks)
      .orderBy(dailyTasks.createdAt);

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Error fetching admin tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      shortDescription, 
      imageUrl, 
      taskType, 
      taskData, 
      yapsReward, 
      isRecurrent, 
      scheduledDate, 
      createdBy 
    } = body;

    // Verify admin access
    if (!createdBy || createdBy.toLowerCase() !== process.env.ADMIN_WALLET?.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate required fields
    if (!title || !shortDescription || !taskType || !taskData || !yapsReward || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create new task
    const newTask = await db.insert(dailyTasks).values({
      title,
      shortDescription,
      imageUrl: imageUrl || null,
      taskType,
      taskData,
      bonesReward: yapsReward,
      recurrenceType: body?.recurrenceType || 'single_day',
      isRecurrent: isRecurrent || false,
      scheduledDate,
      createdBy,
      isActive: true,
    }).returning();

    return NextResponse.json({ success: true, task: newTask[0] });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
