'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type ReferralEntry = {
  rank: number;
  walletAddress: string;
  refs: number;
};

export default function ReferralLeaderboard() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        setEntries(data.referralLeaderboard || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myEntry = useMemo(() => {
    if (!address) return undefined;
    return entries.find((e) => e.walletAddress?.toLowerCase() === address.toLowerCase());
  }, [entries, address]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Referral Leaderboard</h2>
        <div className="text-sm text-gray-400">Ranked by number of invited signups</div>
      </div>

      {myEntry ? (
        <div className="bg-green-600/15 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Your position</div>
            <div className="text-sm text-gray-300 font-mono">
              {myEntry.walletAddress.slice(0, 6)}...{myEntry.walletAddress.slice(-4)}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div className="text-3xl font-extrabold text-white">#{myEntry.rank}</div>
            <div className="text-right text-3xl font-extrabold text-green-400">{myEntry.refs}</div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl p-4 text-sm text-gray-300">
          It appears that you still haven't referred anyone yet.
        </div>
      )}

      <div className="glass-effect rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-gray-300">
            <div>RANK</div>
            <div className="text-right">REFS</div>
            <div className="text-right">WALLET</div>
          </div>
        </div>
        <div className="divide-y divide-gray-700">
          {entries.map((r) => (
            <div key={r.rank} className={`p-4 transition-all hover:bg-gray-800/30 ${myEntry && r.walletAddress.toLowerCase() === myEntry.walletAddress.toLowerCase() ? 'bg-green-600/10' : ''}`}>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm font-bold">#{r.rank}</div>
                <div className="text-right text-blue-400 font-bold text-lg">{r.refs}</div>
                <div className="text-right text-sm text-gray-400 font-mono">{r.walletAddress.slice(0,6)}...{r.walletAddress.slice(-4)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


