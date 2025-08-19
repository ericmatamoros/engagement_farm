import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dailyTasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { isAdminWallet } from '@/lib/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    const body = await request.json();
    const { 
      title, 
      shortDescription, 
      imageUrl, 
      taskType, 
      taskData, 
      yapsReward, 
      recurrenceType,
      isRecurrent, 
      scheduledDate, 
      createdBy 
    } = body;

    // Verify admin access
    if (!createdBy || createdBy.toLowerCase() !== process.env.ADMIN_WALLET?.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update task
    const updatedTask = await db
      .update(dailyTasks)
      .set({
        title,
        shortDescription,
        imageUrl: imageUrl || null,
        taskType,
        taskData,
        bonesReward: yapsReward,
        recurrenceType: recurrenceType || 'single_day',
        isRecurrent: isRecurrent || false,
        scheduledDate,
        updatedAt: new Date(),
      })
      .where(eq(dailyTasks.id, taskId))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask[0] });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    const body = await request.json();
    const { isActive, adminWallet } = body;

    // Verify admin access
    if (!adminWallet || !isAdminWallet(adminWallet)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update task status
    const updatedTask = await db
      .update(dailyTasks)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(dailyTasks.id, taskId))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask[0] });

  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    const searchParams = request.nextUrl.searchParams;
    const adminWallet = searchParams.get('admin_wallet');

    // Verify admin access
    if (!adminWallet || adminWallet.toLowerCase() !== process.env.ADMIN_WALLET?.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete task
    const deletedTask = await db
      .delete(dailyTasks)
      .where(eq(dailyTasks.id, taskId))
      .returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
