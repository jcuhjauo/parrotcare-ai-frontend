'use client';
import Link from 'next/link';
import HealthRecordScanner from '../components/HealthRecordScanner';

export default function ScanPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-md px-4 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs tracking-widest text-moss uppercase">
            牡丹鸚鵡照護 · 健康紀錄
          </p>
                    <div className="flex items-center gap-2">
            <Link
              href="/records"
              className="rounded-full border border-moss px-3 py-1 text-xs font-medium text-moss"
            >
              查看紀錄
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('auth_token');
                window.location.href = '/login';
              }}
              className="rounded-full border border-coral px-3 py-1 text-xs font-medium text-coral-dark"
            >
              登出
            </button>
          </div>
        </div>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold leading-snug text-ink">
          把獸醫的紙本，
          <br />
          變成看得懂的紀錄
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          拍下藥單或健檢報告，AI 幫你整理成日期、體重、用藥這些清楚的欄位——你只需要確認一下，不用自己打字。
        </p>
      </header>

      <div className="feather-edge bg-coral" />

      <div className="bg-card pb-16 pt-8">
        <HealthRecordScanner parrotId={1} />
      </div>
    </main>
  );
}