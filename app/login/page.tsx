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
      <div className="w-full max-w-xs space-y-4">
        
          <a href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sand bg-white py-3 text-sm font-medium text-ink"
        >
          使用 Google 登入
        </a>

        

       
      </div>
    </div>
  );
}