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
      .select({ id: userTaskCompletions.id, verificationStatus: userTaskCompletions.verificationStatus })
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
      const existing = existingCompletion[0];
      if (existing.verificationStatus === 'verified') {
        return NextResponse.json({ error: 'Task already completed today' }, { status: 400 });
      }
      // Allow retry: remove previous failed/pending attempt and re-verify
      await db.delete(userTaskCompletions).where(eq(userTaskCompletions.id, existing.id));
    }

    // Perform real verification against Twitter API v2
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
      message: verificationResult.message,
      debug: verificationResult.data || undefined,
    });

  } catch (error) {
    console.error('Error verifying task:', error);
    return NextResponse.json({ error: 'Failed to verify task' }, { status: 500 });
  }
}

async function verifyTaskCompletion(task: any, user: any) {
  try {
    switch (task.taskType) {
      case 'like':
        return await verifyTwitterLike(task.taskData?.tweetId, user);
      case 'repost':
        return await verifyTwitterRetweet(task.taskData?.tweetId, user);
      case 'follow':
        return await verifyTwitterFollow(task.taskData?.username, user);
      case 'publish_tag':
        return await verifyTwitterHashtagPost(task.taskData?.hashtag, user);
      case 'comment':
        return await verifyTwitterComment(task.taskData?.tweetId, user);
      default:
        return { verified: false, message: 'Unknown task type', data: {} };
    }
  } catch (error) {
    console.error('Verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, message: 'Verification failed', data: { error: message } };
  }
}

// Helpers
function toBasicAuth(clientId: string, clientSecret: string) {
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

function extractTweetId(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/status\/(\d+)/) || trimmed.match(/statuses\/(\d+)/);
  if (m && m[1]) return m[1];
  return null;
}

function extractUsername(input: string | undefined | null): string | null {
  if (!input) return null;
  let s = String(input).trim();
  if (s.startsWith('@')) s = s.slice(1);
  try {
    if (s.startsWith('http')) {
      const url = new URL(s);
      s = url.pathname.split('/').filter(Boolean)[0] || s;
    }
  } catch {}
  if (!s) return null;
  return s;
}

async function refreshTwitterToken(user: any): Promise<{ accessToken: string; refreshToken?: string } | null> {
  if (!user.twitterRefreshToken) return null;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: user.twitterRefreshToken,
    client_id: process.env.TWITTER_CLIENT_ID || '',
  });

  const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (process.env.TWITTER_CLIENT_SECRET) {
    headers['Authorization'] = `Basic ${toBasicAuth(process.env.TWITTER_CLIENT_ID || '', process.env.TWITTER_CLIENT_SECRET)}`;
  }

  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers,
    body: body.toString(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const newAccess = data.access_token as string;
  const newRefresh = (data.refresh_token as string) || user.twitterRefreshToken;
  await db.update(users).set({ twitterAccessToken: newAccess, twitterRefreshToken: newRefresh }).where(eq(users.id, user.id));
  user.twitterAccessToken = newAccess;
  user.twitterRefreshToken = newRefresh;
  return { accessToken: newAccess, refreshToken: newRefresh };
}

async function twitterFetch(user: any, url: string, init?: RequestInit) {
  const doFetch = async (token: string) => {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
    return res;
  };

  let res = await doFetch(user.twitterAccessToken);
  if (res.status === 401) {
    const refreshed = await refreshTwitterToken(user);
    if (refreshed) res = await doFetch(refreshed.accessToken);
  }
  return res;
}

async function ensureTwitterUserId(user: any) {
  if (user.twitterId) return user.twitterId;
  const res = await twitterFetch(user, 'https://api.twitter.com/2/users/me');
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.data?.id) {
    user.twitterId = data.data.id;
    await db.update(users).set({ twitterId: user.twitterId }).where(eq(users.id, user.id));
  }
  return user.twitterId || null;
}

async function verifyTwitterLike(tweetIdInput: string, user: any) {
  const tweetId = extractTweetId(tweetIdInput || '');
  const userId = await ensureTwitterUserId(user);
  if (!tweetId || !userId) return { verified: false, message: 'Missing tweet/user id', data: {} };
  // Prefer user-centric endpoint: liked tweets of the user
  const userLikedUrl = `https://api.twitter.com/2/users/${userId}/liked_tweets?max_results=100&tweet.fields=id`;
  let res = await twitterFetch(user, userLikedUrl);
  if (!res.ok) {
    // Fallback to liking_users if liked_tweets denied
    const likingUsersUrl = `https://api.twitter.com/2/tweets/${tweetId}/liking_users?user.fields=id`;
    const fallback = await twitterFetch(user, likingUsersUrl);
    if (!fallback.ok) {
      let info: any = undefined;
      try { info = await fallback.json(); } catch {}
      return { verified: false, message: `Twitter API error (${fallback.status})`, data: { status: fallback.status, info, endpoint: likingUsersUrl } };
    }
    const fdata = await fallback.json();
    const fverified = Array.isArray(fdata?.data) && fdata.data.some((u: any) => u.id === userId);
    return { verified: fverified, message: fverified ? 'Like verified' : 'Like not found', data: { tweetId, endpoint: likingUsersUrl } };
  }
  const data = await res.json();
  const verified = Array.isArray(data?.data) && data.data.some((t: any) => t.id === tweetId);
  return { verified, message: verified ? 'Like verified' : 'Like not found', data: { tweetId, endpoint: userLikedUrl } };
}

async function verifyTwitterRetweet(tweetIdInput: string, user: any) {
  const tweetId = extractTweetId(tweetIdInput || '');
  const userId = await ensureTwitterUserId(user);
  if (!tweetId || !userId) return { verified: false, message: 'Missing tweet/user id', data: {} };
  // Prefer user tweets with referenced_tweets to detect retweet
  const userTweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=referenced_tweets`;
  let res = await twitterFetch(user, userTweetsUrl);
  if (!res.ok) {
    // Fallback to retweeted_by
    const retweetedByUrl = `https://api.twitter.com/2/tweets/${tweetId}/retweeted_by?user.fields=id`;
    const fallback = await twitterFetch(user, retweetedByUrl);
    if (!fallback.ok) {
      let info: any = undefined;
      try { info = await fallback.json(); } catch {}
      return { verified: false, message: `Twitter API error (${fallback.status})`, data: { status: fallback.status, info, endpoint: retweetedByUrl } };
    }
    const fdata = await fallback.json();
    const fverified = Array.isArray(fdata?.data) && fdata.data.some((u: any) => u.id === userId);
    return { verified: fverified, message: fverified ? 'Retweet verified' : 'Retweet not found', data: { tweetId, endpoint: retweetedByUrl } };
  }
  const data = await res.json();
  const verified = Array.isArray(data?.data) && data.data.some((t: any) => Array.isArray(t.referenced_tweets) && t.referenced_tweets.some((r: any) => r.type === 'retweeted' && r.id === tweetId));
  return { verified, message: verified ? 'Retweet verified' : 'Retweet not found', data: { tweetId, endpoint: userTweetsUrl } };
}

async function verifyTwitterFollow(usernameInput: string, user: any) {
  const userId = await ensureTwitterUserId(user);
  const targetUsername = extractUsername(usernameInput || '');
  if (!userId || !targetUsername) return { verified: false, message: 'Missing user/username', data: {} };
  // Resolve target user id
  const resolveUserUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(targetUsername)}`;
  const targetRes = await twitterFetch(user, resolveUserUrl);
  if (!targetRes.ok) {
    let info: any = undefined;
    try { info = await targetRes.json(); } catch {}
    return { verified: false, message: `Twitter API error (${targetRes.status})`, data: { status: targetRes.status, info, endpoint: resolveUserUrl } };
  }
  const targetData = await targetRes.json();
  const targetId = targetData?.data?.id;
  if (!targetId) return { verified: false, message: 'Target not found', data: {} };
  // Check following
  const followingUrl = `https://api.twitter.com/2/users/${userId}/following?max_results=1000&user.fields=id`;
  const res = await twitterFetch(user, followingUrl);
  if (!res.ok) {
    let info: any = undefined;
    try { info = await res.json(); } catch {}
    return { verified: false, message: `Twitter API error (${res.status})`, data: { status: res.status, info, endpoint: followingUrl } };
  }
  const data = await res.json();
  const verified = Array.isArray(data?.data) && data.data.some((u: any) => u.id === targetId);
  return { verified, message: verified ? 'Follow verified' : 'Follow not found', data: { targetUsername, endpoint: followingUrl } };
}

async function verifyTwitterHashtagPost(hashtagInput: string, user: any) {
  const userId = await ensureTwitterUserId(user);
  if (!userId) return { verified: false, message: 'Missing user id', data: {} };
  const hashtag = (hashtagInput || '').trim();
  if (!hashtag) return { verified: false, message: 'Missing hashtag', data: {} };
  const hash = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
  const query = encodeURIComponent(`from:${userId} ${hash} -is:retweet`);
  const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=25&tweet.fields=created_at`;
  const res = await twitterFetch(user, searchUrl);
  if (!res.ok) {
    let info: any = undefined;
    try { info = await res.json(); } catch {}
    return { verified: false, message: `Twitter API error (${res.status})`, data: { status: res.status, info, endpoint: searchUrl } };
  }
  const data = await res.json();
  const verified = Array.isArray(data?.data) && data.data.length > 0;
  return { verified, message: verified ? 'Hashtag post found' : 'No hashtag post found', data: { hashtag: hash, endpoint: searchUrl } };
}

async function verifyTwitterComment(tweetIdInput: string, user: any) {
  const userId = await ensureTwitterUserId(user);
  const tweetId = extractTweetId(tweetIdInput || '');
  if (!userId || !tweetId) return { verified: false, message: 'Missing tweet/user id', data: {} };
  const query = encodeURIComponent(`conversation_id:${tweetId} from:${userId} -is:retweet`);
  const searchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=25&tweet.fields=conversation_id,author_id,created_at`;
  const res = await twitterFetch(user, searchUrl);
  if (!res.ok) {
    let info: any = undefined;
    try { info = await res.json(); } catch {}
    return { verified: false, message: `Twitter API error (${res.status})`, data: { status: res.status, info, endpoint: searchUrl } };
  }
  const data = await res.json();
  const verified = Array.isArray(data?.data) && data.data.length > 0;
  return { verified, message: verified ? 'Reply found' : 'Reply not found', data: { tweetId, endpoint: searchUrl } };
}
