'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletModalButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletModalButton),
  { ssr: false }
);

export default function SolanaConnect() {
  const { publicKey, disconnect } = useWallet();
  const address = useMemo(() => publicKey?.toBase58(), [publicKey]);

  if (!address) {
    return (
      <div className="z-50">
        <WalletModalButton className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium" />
      </div>
    );
  }

  const short = `${address.slice(0, 4)}..${address.slice(-4)}`;
  return (
    <div className="flex items-center space-x-2 z-50">
      <div className="px-3 py-1 rounded-md bg-purple-600/30 border border-purple-400/40 text-purple-200 text-sm font-mono">
        {short}
      </div>
      <button
        onClick={() => disconnect()}
        className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
      >
        Disconnect
      </button>
    </div>
  );
}


