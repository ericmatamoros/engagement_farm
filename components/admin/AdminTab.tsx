'use client';

import AdminTaskForm from '@/components/admin/AdminTaskForm';
import TaskList from '@/components/admin/TaskList';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function AdminTab() {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Administrator</h2>
        <button
          onClick={() => setShowCreateTask(true)}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      <TaskList />

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


