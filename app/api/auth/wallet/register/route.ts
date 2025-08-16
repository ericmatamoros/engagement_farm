import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, referralRewards } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';

// Register/connect a wallet with a required 4-digit referral code.
// Body: { walletAddress: string, referralCode: string }
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, referralCode } = await request.json();
    if (!walletAddress || !referralCode || referralCode.length !== 4) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Ensure referral code exists (case-insensitive) or allow admin bootstrap code
    const normalized = referralCode.toUpperCase();
    const adminCode = (process.env.ADMIN_REFERRAL_CODE || '1EMM').toUpperCase();
    const referrer = await db.select().from(users).where(eq(users.referralCode, normalized)).limit(1);
    const isAdminBootstrap = normalized === adminCode;
    if (referrer.length === 0 && !isAdminBootstrap) {
      return NextResponse.json({ error: 'Referral code not found' }, { status: 404 });
    }

    // Check if wallet already exists
    const existing = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Wallet already registered' }, { status: 400 });
    }

    // Create unique 4-digit code for the new user
    const codeForNewUser = await generateUniqueReferralCode();
    const [newUser] = await db.insert(users).values({
      walletAddress,
      referralCode: codeForNewUser,
      referredBy: isAdminBootstrap ? null : referrer[0].id,
    }).returning();

    // Award referrer only when not using admin bootstrap code
    if (!isAdminBootstrap && referrer.length > 0) {
      await db.insert(referralRewards).values({
        referrerId: referrer[0].id,
        referredUserId: newUser.id,
        bonesAwarded: 100,
      });

      // Update referrer BONES total using drizzle update
      await db
        .update(users)
        .set({
          bones: sql`${users.bones} + 100`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, referrer[0].id));
    }

    return NextResponse.json({ success: true, userId: newUser.id, referralCode: codeForNewUser });
  } catch (e) {
    console.error('Wallet register error', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

async function generateUniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    const exists = await db.select().from(users).where(eq(users.referralCode, candidate)).limit(1);
    if (exists.length === 0) return candidate;
  }
  // Fallback – extremely unlikely to hit
  return '0000';
}


