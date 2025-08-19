'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

export default function UploadInvites() {
  const { address } = useAccount();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{inserted:number; skipped:number} | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/admin/invites/upload?admin_wallet=${address}`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setResult(data);
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
    </div>
  );
}


