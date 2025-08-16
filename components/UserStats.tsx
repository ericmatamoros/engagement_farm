'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Trophy, 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Award,
  Target,
  Clock
} from 'lucide-react';

interface UserStats {
  totalYaps: number;
  rank: number;
  tasksCompleted: number;
  totalTasks: number;
  referrals: number;
  joinDate: string;
  weeklyYaps: number;
  monthlyYaps: number;
  completionRate: number;
}

export default function UserStats() {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchUserStats();
    }
  }, [address]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/user/stats?wallet=${address}`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Mock data for development
      setStats({
        totalYaps: 1250,
        rank: 42,
        tasksCompleted: 28,
        totalTasks: 35,
        referrals: 3,
        joinDate: '2024-01-15',
        weeklyYaps: 180,
        monthlyYaps: 720,
        completionRate: 80,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Unable to load stats</p>
          <p className="text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Stats</h2>
        <div className="text-sm text-gray-400">
          Your performance overview
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {stats.totalYaps.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total BONES</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-blue-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+{stats.weeklyYaps} this week</span>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-blue-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                #{stats.rank}
              </div>
              <div className="text-sm text-gray-400">Global Rank</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Top {Math.round((stats.rank / 1000) * 100)}% of users
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {stats.tasksCompleted}
              </div>
              <div className="text-sm text-gray-400">Tasks Done</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {stats.completionRate}% completion rate
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-purple-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">
                {stats.referrals}
              </div>
              <div className="text-sm text-gray-400">Referrals</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Earn bonus BONES for each referral
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Task Progress</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tasks Completed</span>
              <span className="text-sm text-gray-400">
                {stats.tasksCompleted} / {stats.totalTasks}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.tasksCompleted / stats.totalTasks) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.weeklyYaps}</div>
              <div className="text-sm text-gray-400">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">{stats.monthlyYaps}</div>
              <div className="text-sm text-gray-400">This Month</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.completionRate}%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Member Since</span>
            </div>
            <p className="text-gray-300 ml-8">{formatDate(stats.joinDate)}</p>
          </div>

          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Target className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Next Goal</span>
            </div>
            <p className="text-gray-300 ml-8">Reach top 25 ranking</p>
          </div>
        </div>
      </div>

      {/* Achievement Badges (Future Feature) */}
      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Achievements</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-800/30 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-sm font-medium">First Task</div>
            <div className="text-xs text-gray-400">Completed first task</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/30 rounded-lg opacity-50">
            <Trophy className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Top 100</div>
            <div className="text-xs text-gray-400">Reach top 100 ranking</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/30 rounded-lg opacity-50">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Referrer</div>
            <div className="text-xs text-gray-400">Refer 5 friends</div>
          </div>
          
          <div className="text-center p-4 bg-gray-800/30 rounded-lg opacity-50">
            <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-medium">Consistent</div>
            <div className="text-xs text-gray-400">7 day streak</div>
          </div>
        </div>
      </div>
    </div>
  );
}
