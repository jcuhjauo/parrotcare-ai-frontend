'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/site-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setError('密碼錯誤');
      return;
    }

    router.push('/scan');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4 rounded-2xl border border-sand bg-white p-6"
      >
        <p className="text-center text-lg font-bold text-ink">請輸入密碼</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm outline-none focus:border-coral"
          autoFocus
        />
        {error && <p className="text-sm text-coral-dark">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-coral py-3 text-sm font-medium text-white"
        >
          進入
        </button>
      </form>
    </div>
  );
}
