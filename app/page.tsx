'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import SolanaConnect from '@/components/SolanaConnect';
import { Wallet, Twitter, Trophy, CheckCircle, Users, Calendar, Settings } from 'lucide-react';
import WalletConnection from '@/components/WalletConnection';
import TwitterConnection from '@/components/TwitterConnection';
// Referral removed
import DailyTasks from '@/components/DailyTasks';
import Leaderboard from '@/components/Leaderboard';
import UserStats from '@/components/UserStats';
import AdminTab from '@/components/admin/AdminTab';
import ReferralLeaderboard from '@/components/ReferralLeaderboard';
import LeaderboardsCombined from '@/components/LeaderboardsCombined';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();
  const isConnected = connected;
  const [activeTab, setActiveTab] = useState('tasks');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const baseTabs = [
    { id: 'tasks', label: 'Daily Tasks', icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'stats', label: 'My Stats', icon: Users },
  ];
  const tabs = isAdmin
    ? [...baseTabs, { id: 'admin', label: 'Administrator', icon: Settings }]
    : baseTabs;

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        if (!address) {
          setIsAdmin(false);
          return;
        }
        const res = await fetch(`/api/admin/check?wallet=${address}`);
        const data = await res.json();
        setIsAdmin(!!data.isAdmin);
        if (!data.isAdmin && activeTab === 'admin') {
          setActiveTab('tasks');
        }
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [address]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #0ea5e9 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="mono-font text-white text-2xl font-extrabold tracking-widest">milo</span>
          </div>
          
          <div className="flex items-center space-x-4 relative z-50">
            <SolanaConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {!isConnected ? (
          /* Welcome Screen */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-12">
            {/* Left Side - Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-6xl font-bold mb-6 text-white mono-font" style={{ letterSpacing: '1px' }}>
                  WELCOME TO milo
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join the <span className="text-blue-400">Attention Mining Mission</span> to earn BONES.
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
                <div className="text-left space-y-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-white font-bold">1.</span>
                    <p>Start tweeting with the tag @MiloOnChains.</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-white font-bold">2.</span>
                    <p>Perform the daily tasks to win BONES</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-white font-bold">3.</span>
                    <p>Refer friends for boosts and increments</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Stats Panel */}
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                <button className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md font-medium">
                  My Stats
                </button>
                <button className="flex-1 py-2 px-4 text-gray-400 hover:text-white transition-colors">
                  Daily Tasks
                </button>
                <button className="flex-1 py-2 px-4 text-gray-400 hover:text-white transition-colors">
                  Leaderboard
                </button>
              </div>

              {/* Your Wallet Section */}
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Your Wallet</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-white">Disconnected</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-medium">X Connection</h4>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-white">Not Connected</span>
                      </div>
                      <button className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1 rounded font-medium text-sm transition-colors">
                        CONNECT X
                      </button>
                    </div>
                  </div>

                  {/* Referral feature removed */}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Connected User Interface - Block Stranding Style */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Tasks/Content */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white" style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
                WELCOME BACK!
              </h2>
              
              {/* Tab Content */}
              <div className="min-h-96">
                {activeTab === 'tasks' && <DailyTasks />}
                {activeTab === 'leaderboard' && <LeaderboardsCombined />}
                {activeTab === 'stats' && <UserStats />}
                {activeTab === 'admin' && isAdmin && <AdminTab />}
              </div>
            </div>

            {/* Right Side - Stats Panel (Same as before) */}
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-green-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Your Wallet Section */}
              <div className="bg-gray-900/50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Your Wallet</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-white">Connected</span>
                    </div>
                    <div className="bg-green-400 text-black px-4 py-1 rounded font-bold text-sm">
                      {address?.slice(0, 4)}.{address?.slice(-4)}
                    </div>
                  </div>

                  <TwitterConnection />

                  {/* Referral feature removed */}

                  {/* Mini stats removed per request */}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
