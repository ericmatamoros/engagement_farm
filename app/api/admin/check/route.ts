import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const adminWallet = process.env.ADMIN_WALLET?.toLowerCase();
    const isAdmin = walletAddress.toLowerCase() === adminWallet;

    return NextResponse.json({ isAdmin });

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
  }
}
