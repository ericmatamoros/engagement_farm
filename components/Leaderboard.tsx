'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  walletAddress: string;
  yaps: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Mock data for development
      setLeaderboard([
        { rank: 1, username: 'xCryptoBro', walletAddress: '0x1234...5678', yaps: 18422 },
        { rank: 2, username: 'babla99_', walletAddress: '0x2345...6789', yaps: 14103 },
        { rank: 3, username: 'LibertyNFTs', walletAddress: '0x3456...7890', yaps: 13835 },
        { rank: 4, username: 'ekang_uyhaw', walletAddress: '0x4567...8901', yaps: 13690 },
        { rank: 5, username: 'bishop0x', walletAddress: '0x5678...9012', yaps: 13329 },
        { rank: 6, username: 'loveroseart', walletAddress: '0x6789...0123', yaps: 13001 },
        { rank: 7, username: '0xDEDA1E', walletAddress: '0x7890...1234', yaps: 10854 },
        { rank: 8, username: 'CH__Smiles', walletAddress: '0x8901...2345', yaps: 10813 },
        { rank: 9, username: '0xfreepearl', walletAddress: '0x9012...3456', yaps: 10588 },
        { rank: 10, username: 'queensheina_', walletAddress: '0x0123...4567', yaps: 10557 },
        { rank: 11, username: 'Over_Higher', walletAddress: '0x1234...5679', yaps: 10538 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 2:
        return 'text-gray-300 bg-gray-300/10 border-gray-300/20';
      case 3:
        return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
      default:
        return 'text-gray-400 bg-gray-700/30 border-gray-600/20';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <div className="text-sm text-gray-400">
          Top performers by BONES earned
        </div>
      </div>

      <div className="glass-effect rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-gray-700">
            <div className="grid grid-cols-4 gap-4 font-semibold text-sm text-gray-300">
            <div>RANK</div>
            <div>USERNAME</div>
              <div className="text-right">BONES</div>
            <div className="text-right">WALLET</div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`p-4 transition-all hover:bg-gray-800/30 ${
                entry.rank <= 3 ? 'bg-gradient-to-r from-transparent to-gray-800/20' : ''
              }`}
            >
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getRankColor(entry.rank)}`}>
                    {entry.rank <= 3 ? (
                      getRankIcon(entry.rank)
                    ) : (
                      <span className="text-sm font-bold">#{entry.rank}</span>
                    )}
                  </div>
                </div>

                <div className="font-medium">
                  {entry.username}
                </div>

                <div className="text-right">
                  <span className="text-blue-400 font-bold text-lg">
                    {entry.yaps.toLocaleString()}
                  </span>
                </div>

                <div className="text-right text-sm text-gray-400 font-mono">
                  {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {leaderboard.length === 0 && (
                  <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No leaderboard data available</p>
              <p className="text-sm">Complete tasks to earn BONES and climb the board!</p>
          </div>
        </div>
      )}
    </div>
  );
}
