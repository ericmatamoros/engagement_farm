'use client';

import AdminTaskForm from '@/components/admin/AdminTaskForm';
import TaskList from '@/components/admin/TaskList';
import UploadInvites from '@/components/admin/UploadInvites';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function AdminTab() {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [tab, setTab] = useState<'tasks' | 'users'>('tasks');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Administrator</h2>
        {tab === 'tasks' && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('tasks')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'tasks' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
        >
          Tasks
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'users' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
        >
          Users
        </button>
      </div>

      {tab === 'tasks' && <TaskList />}
      {tab === 'users' && (
        <div className="glass-effect rounded-xl p-6">
          <UploadInvites />
        </div>
      )}

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
              }}
              onCancel={() => setShowCreateTask(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}


