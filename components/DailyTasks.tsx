'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Heart, 
  Repeat2, 
  UserPlus, 
  Hash, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Play
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  shortDescription: string;
  imageUrl?: string;
  taskType: 'repost' | 'like' | 'follow' | 'publish_tag' | 'comment';
  taskData: any;
  bonesReward: number;
  isCompleted: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
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

export default function DailyTasks() {
  const { address } = useAccount();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasReferral, setHasReferral] = useState<boolean | null>(null);

  useEffect(() => {
    if (address) {
      fetchDailyTasks();
      fetchReferralStatus();
    }
    const listener = () => {
      // Re-fetch when user finishes registration
      fetchReferralStatus();
      fetchDailyTasks();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('referral-registered', listener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('referral-registered', listener);
      }
    };
  }, [address]);

  const fetchDailyTasks = async () => {
    try {
      const response = await fetch(`/api/tasks/daily?wallet=${address}`);
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
          taskData: { tweetId: '1234567890' },
          bonesReward: 10,
          isCompleted: false,
        },
        {
          id: 2,
          title: 'Repost Community Update',
          shortDescription: 'Help spread the word about our community updates',
          taskType: 'repost',
          taskData: { tweetId: '1234567891' },
          bonesReward: 15,
          isCompleted: true,
          verificationStatus: 'verified',
        },
        {
          id: 3,
          title: 'Follow @EngagementFarm',
          shortDescription: 'Stay updated with all our latest news',
          taskType: 'follow',
          taskData: { username: 'EngagementFarm' },
          bonesReward: 20,
          isCompleted: false,
        },
        {
          id: 4,
          title: 'Tweet with #EngagementFarm',
          shortDescription: 'Share your experience with our hashtag',
          taskType: 'publish_tag',
          taskData: { hashtag: '#EngagementFarm' },
          bonesReward: 25,
          isCompleted: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralStatus = async () => {
    try {
      const res = await fetch(`/api/user/twitter-status?wallet=${address}`);
      const data = await res.json();
      setHasReferral(!!data?.referralCode);
    } catch {
      setHasReferral(false);
    }
  };

  const handleTaskAction = async (task: Task) => {
    if (task.isCompleted) return;

    // Open the appropriate Twitter action
    let twitterUrl = '';
    
    switch (task.taskType) {
      case 'like':
        twitterUrl = `https://twitter.com/intent/like?tweet_id=${task.taskData.tweetId}`;
        break;
      case 'repost':
        twitterUrl = `https://twitter.com/intent/retweet?tweet_id=${task.taskData.tweetId}`;
        break;
      case 'follow':
        twitterUrl = `https://twitter.com/intent/follow?screen_name=${task.taskData.username}`;
        break;
      case 'publish_tag':
        twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${task.taskData.hashtag}! 🚀`)}`;
        break;
      case 'comment':
        twitterUrl = `https://twitter.com/intent/tweet?in_reply_to=${task.taskData.tweetId}`;
        break;
    }

    if (twitterUrl) {
      window.open(twitterUrl, '_blank');
    }
  };

  const handleVerifyTask = async (taskId: number) => {
    try {
      const response = await fetch('/api/tasks/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        // Update the task status
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, verificationStatus: 'pending' }
            : task
        ));
      }
    } catch (error) {
      console.error('Error verifying task:', error);
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
            <h2 className="text-2xl font-bold">Daily Tasks</h2>
            <div className="text-sm text-gray-400">
              Complete tasks to earn BONES
            </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map((task) => {
          const Icon = taskIcons[task.taskType];
          const iconColor = taskColors[task.taskType];
          
          return (
            <div key={task.id} className="task-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gray-700/50 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <p className="text-gray-400 text-sm">{task.shortDescription}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-blue-400 font-bold">+{task.bonesReward}</div>
                  <div className="text-xs text-gray-500">BONES</div>
                </div>
              </div>

              {task.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={task.imageUrl} 
                    alt={task.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                {task.isCompleted ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      {task.verificationStatus === 'verified' ? 'Completed' : 'Verifying...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTaskAction(task)}
                      disabled={!hasReferral}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        hasReferral ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>Do Task</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleVerifyTask(task.id)}
                      disabled={!hasReferral}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        hasReferral ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Verify</span>
                    </button>
                  </div>
                )}

                {task.verificationStatus === 'pending' && (
                  <div className="flex items-center space-x-2 text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Pending</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tasks available today</p>
            <p className="text-sm">Check back tomorrow for new tasks!</p>
          </div>
        </div>
      )}
    </div>
  );
}
