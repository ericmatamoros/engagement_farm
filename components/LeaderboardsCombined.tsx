'use client';

import { useState } from 'react';
import Leaderboard from '@/components/Leaderboard';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';

export default function LeaderboardsCombined() {
  const [subTab, setSubTab] = useState<'social' | 'referrals'>('social');

  return (
    <div className="space-y-4">
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setSubTab('social')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            subTab === 'social' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Social
        </button>
        <button
          onClick={() => setSubTab('referrals')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            subTab === 'referrals' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          Referrals
        </button>
      </div>

      {subTab === 'social' ? <Leaderboard /> : <ReferralLeaderboard />}
    </div>
  );
}


