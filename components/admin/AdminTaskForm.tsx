'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Calendar, Image, Hash, Heart, Repeat2, UserPlus, MessageCircle } from 'lucide-react';

interface TaskFormData {
  title: string;
  shortDescription: string;
  imageUrl: string;
  taskType: 'like' | 'repost' | 'follow' | 'publish_tag' | 'comment';
  taskData: any;
  yapsReward: number;
  isRecurrent: boolean;
  scheduledDate: string;
  recurrenceType: 'single_day' | 'daily_repeat' | 'once_until_done';
}

interface AdminTaskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editTask?: any;
}

const taskTypes = [
  { id: 'like', label: 'Like Tweet', icon: Heart, color: 'text-red-400' },
  { id: 'repost', label: 'Repost/Retweet', icon: Repeat2, color: 'text-green-400' },
  { id: 'follow', label: 'Follow User', icon: UserPlus, color: 'text-blue-400' },
  { id: 'publish_tag', label: 'Post with Hashtag', icon: Hash, color: 'text-purple-400' },
  { id: 'comment', label: 'Comment on Tweet', icon: MessageCircle, color: 'text-yellow-400' },
];

export default function AdminTaskForm({ onSuccess, onCancel, editTask }: AdminTaskFormProps) {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: editTask?.title || '',
    shortDescription: editTask?.shortDescription || '',
    imageUrl: editTask?.imageUrl || '',
    taskType: editTask?.taskType || 'like',
    taskData: editTask?.taskData || {},
    yapsReward: editTask?.yapsReward || 10,
    isRecurrent: editTask?.isRecurrent || false,
    scheduledDate: editTask?.scheduledDate || new Date().toISOString().split('T')[0],
    recurrenceType: editTask?.recurrenceType || 'single_day',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editTask ? `/api/admin/tasks/${editTask.id}` : '/api/admin/tasks';
      const method = editTask ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: address,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      taskData: {
        ...prev.taskData,
        [key]: value,
      },
    }));
  };

  const renderTaskDataFields = () => {
    switch (formData.taskType) {
      case 'like':
      case 'repost':
      case 'comment':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Tweet ID or URL</label>
            <input
              type="text"
              value={formData.taskData.tweetId || ''}
              onChange={(e) => updateTaskData('tweetId', e.target.value)}
              placeholder="Tweet ID or full Twitter URL"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              You can paste the full Twitter URL or just the tweet ID
            </p>
          </div>
        );

      case 'follow':
        return (
          <div>
            <label className="block text-sm font-medium mb-2">Username to Follow</label>
            <input
              type="text"
              value={formData.taskData.username || ''}
              onChange={(e) => updateTaskData('username', e.target.value)}
              placeholder="@username (without @)"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        );

      case 'publish_tag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Required Hashtag</label>
              <input
                type="text"
                value={formData.taskData.hashtag || ''}
                onChange={(e) => updateTaskData('hashtag', e.target.value)}
                placeholder="#YourHashtag"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Suggested Text (Optional)</label>
              <textarea
                value={formData.taskData.suggestedText || ''}
                onChange={(e) => updateTaskData('suggestedText', e.target.value)}
                placeholder="Suggested tweet text..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const selectedTaskType = taskTypes.find(t => t.id === formData.taskType);

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Task Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter task title"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">BONES Reward</label>
          <input
            type="number"
            value={formData.yapsReward}
            onChange={(e) => setFormData(prev => ({ ...prev, yapsReward: parseInt(e.target.value) }))}
            min="1"
            max="1000"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Short Description</label>
        <textarea
          value={formData.shortDescription}
          onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
          placeholder="Brief description of the task"
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Task Type Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Task Type</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {taskTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, taskType: type.id as any, taskData: {} }))}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.taskType === type.id
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task-Specific Data */}
      {selectedTaskType && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h4 className="font-medium mb-4 flex items-center space-x-2">
            <selectedTaskType.icon className={`w-5 h-5 ${selectedTaskType.color}`} />
            <span>{selectedTaskType.label} Configuration</span>
          </h4>
          {renderTaskDataFields()}
        </div>
      )}

      {/* Scheduling Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Scheduled Date</label>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="flex items-center">
          <div className="w-full">
            <label className="block text-sm font-medium mb-2">Recurrence</label>
            <select
              value={formData.recurrenceType}
              onChange={(e) => setFormData(prev => ({ ...prev, recurrenceType: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="single_day">Single day (show only on scheduled date)</option>
              <option value="daily_repeat">Daily (verify every day)</option>
              <option value="once_until_done">Daily until completed once</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
