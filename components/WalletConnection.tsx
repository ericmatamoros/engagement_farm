'use client';

import dynamic from 'next/dynamic';

export default function WalletConnection() {
  const WalletMultiButton = dynamic(
    () => import('@solana/wallet-adapter-react-ui').then((m) => m.WalletMultiButton),
    { ssr: false }
  );

  return (
    <div className="text-center">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">
          Connect your wallet to start earning BONES through social engagement
        </p>
      </div>
      <div className="flex justify-center">
        <WalletMultiButton />
      </div>
    </div>
  );
}
