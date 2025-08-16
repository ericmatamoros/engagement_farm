'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  Clock,
  BarChart3,
  Activity
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  totalCompletions: number;
  totalYapsDistributed: number;
  activeUsers: number;
  todayCompletions: number;
  weeklyGrowth: number;
  topPerformers: Array<{
    username: string;
    yaps: number;
    completions: number;
  }>;
}

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, all

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`);
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Mock data for development
      setStats({
        totalUsers: 1247,
        totalTasks: 15,
        totalCompletions: 3456,
        totalYapsDistributed: 45780,
        activeUsers: 892,
        todayCompletions: 234,
        weeklyGrowth: 12.5,
        topPerformers: [
          { username: 'xCryptoBro', yaps: 18422, completions: 45 },
          { username: 'babla99_', yaps: 14103, completions: 38 },
          { username: 'LibertyNFTs', yaps: 13835, completions: 42 },
        ],
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
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Unable to load statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Platform Statistics</h2>
        
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: '24h', label: '24h' },
            { id: '7d', label: '7d' },
            { id: '30d', label: '30d' },
            { id: 'all', label: 'All' },
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                timeRange === range.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">
                {stats.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {stats.activeUsers} active users
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-green-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {stats.totalTasks}
              </div>
              <div className="text-sm text-gray-400">Total Tasks</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            Active campaigns running
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-purple-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">
                {stats.totalCompletions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Completions</div>
            </div>
          </div>
          <div className="text-sm text-gray-400">
            {stats.todayCompletions} today
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-yellow-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                {stats.totalYapsDistributed.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">YAPS Distributed</div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+{stats.weeklyGrowth}% this week</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Activity Overview</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">User Engagement</span>
              <span className="text-sm font-medium">
                {Math.round((stats.activeUsers / stats.totalUsers) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                style={{ width: `${(stats.activeUsers / stats.totalUsers) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Task Completion Rate</span>
              <span className="text-sm font-medium">
                {Math.round((stats.totalCompletions / (stats.totalUsers * stats.totalTasks)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                style={{ width: `${Math.round((stats.totalCompletions / (stats.totalUsers * stats.totalTasks)) * 100)}%` }}
              />
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-400">{stats.activeUsers}</div>
                  <div className="text-xs text-gray-400">Active Users</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-400">{stats.todayCompletions}</div>
                  <div className="text-xs text-gray-400">Today</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-400">+{stats.weeklyGrowth}%</div>
                  <div className="text-xs text-gray-400">Growth</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Top Performers</span>
          </h3>
          
          <div className="space-y-4">
            {stats.topPerformers.map((performer, index) => (
              <div key={performer.username} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400/20 text-yellow-400' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    'bg-amber-600/20 text-amber-600'
                  }`}>
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{performer.username}</div>
                    <div className="text-sm text-gray-400">{performer.completions} completions</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">{performer.yaps.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">YAPS</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <button className="w-full text-center text-blue-400 hover:text-blue-300 text-sm transition-colors">
              View Full Leaderboard →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-effect rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Recent Activity</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">New user registered: @newuser123</span>
            </div>
            <span className="text-xs text-gray-400">2 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-sm">Task completed: "Like Our Latest Tweet"</span>
            </div>
            <span className="text-xs text-gray-400">5 minutes ago</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-sm">New task created: "Follow @EngagementFarm"</span>
            </div>
            <span className="text-xs text-gray-400">1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
