'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock, 
  Heart, 
  Repeat2, 
  UserPlus, 
  Hash, 
  MessageCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  shortDescription: string;
  taskType: string;
  yapsReward: number;
  isRecurrent: boolean;
  scheduledDate: string;
  isActive: boolean;
  completionCount: number;
  createdAt: string;
}

const taskIcons = {
  like: Heart,
  repost: Repeat2,
  follow: UserPlus,
  publish_tag: Hash,
  comment: MessageCircle,
};

const taskColors = {
  like: 'text-red-400',
  repost: 'text-green-400',
  follow: 'text-blue-400',
  publish_tag: 'text-purple-400',
  comment: 'text-yellow-400',
};

export default function TaskList() {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, scheduled, completed

  useEffect(() => {
    if (address) fetchTasks();
  }, [address]);

  const fetchTasks = async () => {
    try {
      if (!address) return;
      const response = await fetch(`/api/admin/tasks?admin_wallet=${address}`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Mock data for development
      setTasks([
        {
          id: 1,
          title: 'Like Our Latest Tweet',
          shortDescription: 'Show some love to our latest announcement',
          taskType: 'like',
          yapsReward: 10,
          isRecurrent: false,
          scheduledDate: '2024-01-20',
          isActive: true,
          completionCount: 45,
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 2,
          title: 'Follow @EngagementFarm',
          shortDescription: 'Stay updated with all our latest news',
          taskType: 'follow',
          yapsReward: 20,
          isRecurrent: true,
          scheduledDate: '2024-01-20',
          isActive: true,
          completionCount: 32,
          createdAt: '2024-01-15T11:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus, adminWallet: address }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isActive: !currentStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}?admin_wallet=${address}` , {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'active':
        return task.isActive;
      case 'scheduled':
        return task.scheduledDate && new Date(task.scheduledDate) > new Date();
      case 'completed':
        return !task.isActive;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
        {[
          { id: 'all', label: 'All Tasks' },
          { id: 'active', label: 'Active' },
          { id: 'scheduled', label: 'Scheduled' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              filter === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const Icon = taskIcons[task.taskType as keyof typeof taskIcons];
          const iconColor = taskColors[task.taskType as keyof typeof taskColors];
          
          return (
            <div key={task.id} className="glass-effect rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className={`p-2 rounded-lg bg-gray-700/50 ${iconColor}`}>
                    {Icon && <Icon className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      {task.isRecurrent && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                          Recurrent
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.isActive 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-gray-600/20 text-gray-400'
                      }`}>
                        {task.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-3">{task.shortDescription}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{task.completionCount} completions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-blue-400 font-semibold">+{(task as any).yapsReward ?? ''} BONES</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleTaskStatus(task.id, task.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      task.isActive
                        ? 'text-green-400 hover:bg-green-400/20'
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                    title={task.isActive ? 'Deactivate task' : 'Activate task'}
                  >
                    {task.isActive ? (
                      <ToggleRight className="w-5 h-5" />
                    ) : (
                      <ToggleLeft className="w-5 h-5" />
                    )}
                  </button>
                  
                  <button
                    className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                    title="Edit task"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks found</p>
            <p className="text-sm">
              {filter === 'all' ? 'Create your first task to get started!' : `No ${filter} tasks available.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
