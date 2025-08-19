'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function UploadInvites() {
  const { address } = useAccount();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{inserted:number; skipped:number} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    setBusy(true);
    setResult(null);
    setShowSuccess(false);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/admin/invites/upload?admin_wallet=${address}`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setResult(data);
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setBusy(false);
      e.currentTarget.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Upload invites CSV</label>
      <input type="file" accept=".csv,text/csv" onChange={onChange} disabled={busy} />
      {result && (
        <div className="text-sm text-gray-400">Inserted: {result.inserted} • Skipped: {result.skipped}</div>
      )}

      {busy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800 rounded-xl p-6 w-[320px] text-center">
            <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full mx-auto mb-4"></div>
            <div className="text-white font-medium">Uploading…</div>
            <div className="text-xs text-gray-400 mt-1">Processing CSV and writing to database</div>
          </div>
        </div>
      )}

      {showSuccess && !busy && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSuccess(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-[320px] text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
            </div>
            <div className="text-white font-medium">Upload complete</div>
            <div className="text-xs text-gray-400 mt-1">Inserted {result.inserted}, Skipped {result.skipped}</div>
            <button className="mt-4 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm" onClick={() => setShowSuccess(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}


