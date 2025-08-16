'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Twitter, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function TwitterConnection() {
  const { address } = useAccount();
  const [isConnected, setIsConnected] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address) {
      checkTwitterConnection();
    }
  }, [address]);

  const checkTwitterConnection = async () => {
    try {
      const response = await fetch(`/api/user/twitter-status?wallet=${address}`);
      const data = await response.json();
      
      if (data.connected) {
        setIsConnected(true);
        setTwitterUsername(data.username);
      }
    } catch (error) {
      console.error('Error checking Twitter connection:', error);
    }
  };

  const connectTwitter = async () => {
    setIsLoading(true);
    try {
      // Redirect to Twitter OAuth
      window.location.href = `/api/auth/twitter?wallet=${address}`;
    } catch (error) {
      console.error('Error connecting Twitter:', error);
      setIsLoading(false);
    }
  };

  const generateReferralLink = () => {
    // This would generate a referral link for the user
    const referralCode = `${address?.slice(0, 8)}`;
    return `${window.location.origin}?ref=${referralCode}`;
  };

  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium">X Connection</h4>
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-white">
            {isConnected ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        {isConnected ? (
          <div className="bg-green-400 text-black px-4 py-1 rounded font-bold text-sm">
            @{twitterUsername}
          </div>
        ) : (
          <button
            onClick={connectTwitter}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1 rounded font-medium text-sm transition-colors"
          >
            {isLoading ? 'Connecting...' : 'CONNECT X'}
          </button>
        )}
      </div>
      {/* Referral code display */}
      {isConnected && (
        <div className="text-xs text-gray-400">Your code: <span id="ref-code" className="text-blue-300"></span></div>
      )}
    </div>
  );
}
