'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Plus, 
  Calendar, 
  Settings, 
  Users, 
  BarChart3, 
  Edit, 
  Trash2,
  Save,
  X
} from 'lucide-react';
import AdminTaskForm from '@/components/admin/AdminTaskForm';
import AdminStats from '@/components/admin/AdminStats';
import TaskList from '@/components/admin/TaskList';
import UploadInvites from '@/components/admin/UploadInvites';

export default function AdminPanel() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showCreateTask, setShowCreateTask] = useState(false);

  useEffect(() => {
    if (address) {
      checkAdminStatus();
    }
  }, [address]);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`/api/admin/check?wallet=${address}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: Calendar },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have admin privileges</p>
        </div>
      </div>
    );
  }

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
      <header className="relative z-10 p-6 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Admin Panel</h1>
              <p className="text-sm text-gray-400">Engagement Farm Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Admin: {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800/50 rounded-xl p-1 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tasks' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Task Management</h2>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task</span>
                </button>
              </div>
              
              <TaskList />
            </div>
          )}

          {activeTab === 'stats' && <AdminStats />}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">User Management</h2>
              <div className="glass-effect rounded-xl p-6 space-y-6">
                <UploadInvites />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Settings</h2>
              <div className="glass-effect rounded-xl p-6">
                <p className="text-gray-400">Settings panel coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create New Task</h3>
              <button
                onClick={() => setShowCreateTask(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <AdminTaskForm 
              onSuccess={() => {
                setShowCreateTask(false);
                // Refresh task list
              }}
              onCancel={() => setShowCreateTask(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
