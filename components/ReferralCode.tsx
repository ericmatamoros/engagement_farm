'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function ReferralCode() {
  const { address } = useAccount();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [inputCode, setInputCode] = useState('');

  useEffect(() => {
    const fetchCode = async () => {
      if (!address) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/user/twitter-status?wallet=${address}`);
        const data = await res.json();
        if (data?.referralCode) {
          setCode(data.referralCode);
        } else {
          setError('No code available yet');
          setShowModal(true);
        }
      } catch (e) {
        setError('Failed to load code');
      } finally {
        setLoading(false);
      }
    };
    fetchCode();
  }, [address]);

  if (!address) return null;

  return (
    <>
      <div className="bg-gray-800/50 rounded p-3 text-center font-mono">
        {loading ? (
          <span className="text-gray-400 text-sm">Loading...</span>
        ) : code ? (
          <span className="text-blue-300 text-lg tracking-widest">{code}</span>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{error || 'No code yet'}</span>
            <button
              className="text-blue-300 text-xs underline hover:text-blue-200"
              onClick={() => setShowModal(true)}
            >
              Enter code
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#121317] border border-gray-700 rounded-xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold mb-4">Enter invitation code</h3>
            <p className="text-sm text-gray-400 mb-3">
              Enter the 4-digit code from your referrer to register your wallet.
            </p>
            <input
              type="text"
              maxLength={4}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="0000"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-center tracking-widest font-mono text-lg mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                onClick={async () => {
                  if (inputCode.length !== 4 || !address) return;
                  const res = await fetch('/api/auth/wallet/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress: address, referralCode: inputCode.toUpperCase() }),
                  });
                  if (res.ok) {
                    setShowModal(false);
                    const again = await fetch(`/api/user/twitter-status?wallet=${address}`);
                    const data = await again.json();
                    if (data?.referralCode) setCode(data.referralCode);
                    setError(null);
                    // Notify other components (e.g., DailyTasks) to refetch
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('referral-registered'));
                    }
                  } else {
                    const e = await res.json().catch(() => ({}));
                    alert(`Registration failed: ${e.error || res.statusText}`);
                  }
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


