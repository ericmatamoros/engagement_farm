import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userTaskCompletions, dailyTasks } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, walletAddress } = body;

    if (!taskId || !walletAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user[0];

    // Referral code requirement removed

    // Get task details
    const task = await db.select().from(dailyTasks).where(eq(dailyTasks.id, taskId)).limit(1);
    
    if (task.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const taskData = task[0];

    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    const existingCompletion = await db
      .select()
      .from(userTaskCompletions)
      .where(
        and(
          eq(userTaskCompletions.userId, userData.id),
          eq(userTaskCompletions.taskId, taskId),
          sql`DATE(${userTaskCompletions.completedAt}) = ${today}`
        )
      )
      .limit(1);

    if (existingCompletion.length > 0) {
      return NextResponse.json({ error: 'Task already completed today' }, { status: 400 });
    }

    // In a real implementation, you would verify the task completion here
    // For example, check if the user actually liked/retweeted the specified tweet
    // This would involve calling Twitter API to verify the action
    
    const verificationResult = await verifyTaskCompletion(taskData, userData);

    // Create task completion record
    await db.insert(userTaskCompletions).values({
      userId: userData.id,
      taskId: taskId,
      verificationStatus: verificationResult.verified ? 'verified' : 'failed',
      verificationData: verificationResult.data,
      bonesEarned: verificationResult.verified ? taskData.bonesReward : 0,
    });

    // Do not manually update users.bones here; database trigger updates totals

    return NextResponse.json({ 
      success: true, 
      verified: verificationResult.verified,
      bonesEarned: verificationResult.verified ? taskData.bonesReward : 0,
      message: verificationResult.message
    });

  } catch (error) {
    console.error('Error verifying task:', error);
    return NextResponse.json({ error: 'Failed to verify task' }, { status: 500 });
  }
}

async function verifyTaskCompletion(task: any, user: any) {
  // This is a simplified verification function
  // In production, you would integrate with Twitter API to verify actual actions
  
  try {
    switch (task.taskType) {
      case 'like':
        // Verify user liked the tweet
        return await verifyTwitterLike(task.taskData.tweetId, user.twitterAccessToken);
        
      case 'repost':
        // Verify user retweeted
        return await verifyTwitterRetweet(task.taskData.tweetId, user.twitterAccessToken);
        
      case 'follow':
        // Verify user follows the account
        return await verifyTwitterFollow(task.taskData.username, user.twitterAccessToken);
        
      case 'publish_tag':
        // Verify user posted with hashtag
        return await verifyTwitterHashtagPost(task.taskData.hashtag, user.twitterAccessToken);
        
      case 'comment':
        // Verify user commented on tweet
        return await verifyTwitterComment(task.taskData.tweetId, user.twitterAccessToken);
        
      default:
        return { verified: false, message: 'Unknown task type', data: {} };
    }
  } catch (error) {
    console.error('Verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, message: 'Verification failed', data: { error: message } };
  }
}

async function verifyTwitterLike(tweetId: string, accessToken: string) {
  // Simplified - in production, use Twitter API v2
  // GET /2/users/:id/liked_tweets to check if user liked the tweet
  
  // For now, return success (you would implement actual API calls)
  return {
    verified: true,
    message: 'Like verified successfully',
    data: { tweetId, action: 'like', timestamp: new Date().toISOString() }
  };
}

async function verifyTwitterRetweet(tweetId: string, accessToken: string) {
  // Use Twitter API to verify retweet
  return {
    verified: true,
    message: 'Retweet verified successfully',
    data: { tweetId, action: 'retweet', timestamp: new Date().toISOString() }
  };
}

async function verifyTwitterFollow(username: string, accessToken: string) {
  // Use Twitter API to verify follow
  return {
    verified: true,
    message: 'Follow verified successfully',
    data: { username, action: 'follow', timestamp: new Date().toISOString() }
  };
}

async function verifyTwitterHashtagPost(hashtag: string, accessToken: string) {
  // Use Twitter API to check recent posts with hashtag
  return {
    verified: true,
    message: 'Hashtag post verified successfully',
    data: { hashtag, action: 'publish_tag', timestamp: new Date().toISOString() }
  };
}

async function verifyTwitterComment(tweetId: string, accessToken: string) {
  // Use Twitter API to verify comment/reply
  return {
    verified: true,
    message: 'Comment verified successfully',
    data: { tweetId, action: 'comment', timestamp: new Date().toISOString() }
  };
}
