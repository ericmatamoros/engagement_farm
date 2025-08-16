'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();

  useEffect(() => {
    const maybeRegister = async () => {
      if (!isConnected || !address) return;
      // Check if user exists and has referral code
      const statusRes = await fetch(`/api/user/twitter-status?wallet=${address}`);
      const status = await statusRes.json();
      if (status?.referralCode) return; // already registered

      // Ask for 4-digit code
      const code = window.prompt('Enter your 4-digit invitation code to register:');
      if (!code || code.length !== 4) return;
      const res = await fetch('/api/auth/wallet/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, referralCode: code.toUpperCase() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        alert(`Registration failed: ${e.error || res.statusText}`);
      } else {
        // refresh state so code appears
        await fetch(`/api/user/twitter-status?wallet=${address}`, { cache: 'no-store' });
      }
    };
    void maybeRegister();
  }, [isConnected, address]);
  return (
    <div className="text-center">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400">
          Connect your wallet to start earning BONES through social engagement
        </p>
      </div>
      
      <div className="flex justify-center">
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== 'loading';
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === 'authenticated');

            return (
              <div
                {...(!ready && {
                  'aria-hidden': true,
                  style: {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 glow-effect"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="bg-red-600 hover:bg-red-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={openChainModal}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                        type="button"
                      >
                        {chain.hasIcon && (
                          <div
                            style={{
                              background: chain.iconBackground,
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              overflow: 'hidden',
                              marginRight: 4,
                            }}
                          >
                            {chain.iconUrl && (
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                style={{ width: 12, height: 12 }}
                              />
                            )}
                          </div>
                        )}
                        {chain.name}
                      </button>

                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </div>
  );
}
