'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type Stats = {
  totalYaps: number; // BONES
  rank: number;
  referrals: number;
};

export default function UserMiniStats() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!address) return;
      try {
        const res = await fetch(`/api/user/stats?wallet=${address}`);
        const data = await res.json();
        setStats({
          totalYaps: data?.stats?.totalYaps || 0,
          rank: data?.stats?.rank || 0,
          referrals: data?.stats?.referrals || 0,
        });
      } catch {}
    };
    fetchStats();
  }, [address]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-white">#{stats?.rank ?? 0}</div>
        <div className="text-sm text-gray-400">Rank</div>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-white">{stats?.referrals ?? 0}</div>
        <div className="text-sm text-gray-400">Refs</div>
      </div>
      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-blue-400">{stats?.totalYaps ?? 0}</div>
        <div className="text-sm text-gray-400">BONES</div>
      </div>
    </div>
  );
}


