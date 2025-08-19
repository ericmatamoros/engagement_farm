import { NextRequest, NextResponse } from 'next/server';
import { isAdminWallet } from '@/lib/admin';
import { db } from '@/lib/db';
import { invites } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = request.nextUrl.searchParams.get('admin_wallet');
    if (!admin || !isAdminWallet(admin)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

    const text = await file.text();
    // Parse CSV (simple split; expects header row as in screenshot)
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return NextResponse.json({ inserted: 0, skipped: 0 });

    const header = lines[0].split(',').map((h) => h.trim());
    const idx = {
      externalUserId: header.findIndex((h) => /user id/i.test(h)),
      signupWalletAddress: header.findIndex((h) => /signup wallet address/i.test(h)),
      userName: header.findIndex((h) => /user name/i.test(h)),
      invitedByUsername: header.findIndex((h) => /invited by username/i.test(h)),
      invitedBySignupAddress: header.findIndex((h) => /invited by signup address/i.test(h)),
      createdAt: header.findIndex((h) => /created at/i.test(h)),
    };

    const rows = lines.slice(1).map((line) => line.split(',')).filter((cols) => cols.length >= 2);
    let inserted = 0;
    let skipped = 0;

    for (const cols of rows) {
      const extId = (cols[idx.externalUserId] || '').trim();
      if (!extId) { skipped++; continue; }
      const existing = await db.select().from(invites).where(eq(invites.externalUserId, extId)).limit(1);
      if (existing.length > 0) { skipped++; continue; }
      await db.insert(invites).values({
        externalUserId: extId,
        signupWalletAddress: (cols[idx.signupWalletAddress] || '').trim() || null,
        userName: (cols[idx.userName] || '').trim() || null,
        invitedByUsername: (cols[idx.invitedByUsername] || '').trim() || null,
        invitedBySignupAddress: (cols[idx.invitedBySignupAddress] || '').trim() || null,
        createdAt: cols[idx.createdAt] ? new Date(cols[idx.createdAt]) : null,
      });
      inserted++;
    }

    return NextResponse.json({ inserted, skipped });
  } catch (e) {
    console.error('CSV upload error', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}


