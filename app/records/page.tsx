'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Medication = {
  name: string;
  frequency: string | null;
  duration_days: number | null;
};

type LineItem = {
  item: string;
  amount: number | null;
};

type HealthRecord = {
  id: number;
  clinic_name: string | null;
  clinic_phone: string | null;
  clinic_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  pet_name: string | null;
  species: string | null;
  visit_date: string | null;
  weight_grams: number | null;
  medications: Medication[] | null;
  line_items: LineItem[] | null;
  total_amount: number | null;
  next_visit_date: string | null;
  notes: string | null;
  ai_confidence: string | null;
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function RecordsPage() {
  const [records, setRecords] = useState<HealthRecord[] | null>(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<HealthRecord | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function loadRecords() {
    fetch('/api/records', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('讀取失敗');
        return res.json();
      })
      .then((data) => setRecords(data.records))
      .catch(() => setError('無法讀取紀錄，請確認後端伺服器是否啟動'));
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const upcomingReminders = useMemo(() => {
    if (!records) return [];
    return records
      .filter((r) => r.next_visit_date)
      .map((r) => ({ record: r, days: daysUntil(r.next_visit_date as string) }))
      .filter((r) => r.days <= 7)
      .sort((a, b) => a.days - b.days);
  }, [records]);

  function startEdit(record: HealthRecord) {
    setEditingId(record.id);
    setEditDraft({ ...record });
    setExpandedId(record.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  function updateDraftField<K extends keyof HealthRecord>(key: K, value: HealthRecord[K]) {
    setEditDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveEdit() {
    if (!editDraft) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/records/${editDraft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDraft),
      });

      if (!res.ok) throw new Error('儲存失敗');

      setEditingId(null);
      setEditDraft(null);
      loadRecords();
    } catch {
      setError('編輯儲存失敗，請稍後再試');
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteRecord(id: number) {
    if (!confirm('確定要刪除這筆紀錄嗎？此動作無法復原。')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('刪除失敗');
      loadRecords();
    } catch {
      setError('刪除失敗，請稍後再試');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-md px-4 pt-10 pb-6">
        <p className="font-mono text-xs tracking-widest text-moss uppercase">
          牡丹鸚鵡照護 · 健康紀錄
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-ink">
          就診紀錄
        </h1>
        <Link href="/scan" className="mt-3 inline-block text-sm text-sky underline">
          + 新增一筆掃描
        </Link>
      </header>

      <div className="feather-edge bg-coral" />

      <div className="mx-auto max-w-md space-y-3 bg-card px-4 py-8">
        {error && <p className="text-sm text-coral-dark">{error}</p>}

        {upcomingReminders.length > 0 && (
          <div className="space-y-2 rounded-2xl border-2 border-dashed border-coral bg-coral/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-coral-dark">
              複診提醒
            </p>
            {upcomingReminders.map(({ record, days }) => (
              <p key={record.id} className="text-sm text-ink">
                {record.pet_name ?? '鸚鵡'}
                {days < 0
                  ? `的複診已經過期 ${Math.abs(days)} 天`
                  : days === 0
                    ? '今天要複診'
                    : `還有 ${days} 天要複診`}
                （{record.next_visit_date}）
              </p>
            ))}
          </div>
        )}

        {records === null && !error && <p className="text-sm text-ink-soft">載入中...</p>}

        {records?.length === 0 && (
          <p className="text-sm text-ink-soft">還沒有任何紀錄，去掃描第一筆吧。</p>
        )}

        {records?.map((record) => {
          const isExpanded = expandedId === record.id;
          const isEditing = editingId === record.id;

          return (
            <div key={record.id} className="rounded-2xl border border-sand bg-white p-4">
              <button
                onClick={() => !isEditing && setExpandedId(isExpanded ? null : record.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-ink">{record.clinic_name ?? '（未知院所）'}</p>
                    <p className="text-xs text-ink-soft">{record.pet_name ?? '（未知寵物）'}</p>
                  </div>
                  {record.ai_confidence && (
                    <span className="rounded-full border border-sand px-2 py-0.5 font-mono text-[10px] text-ink-soft">
                      {record.ai_confidence}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-xs text-ink-soft">
                  <span>就診：{record.visit_date ?? '—'}</span>
                  {record.total_amount !== null && (
                    <span className="font-mono">${record.total_amount}</span>
                  )}
                </div>
                {!isEditing && (
                  <p className="mt-2 text-center text-xs text-moss">
                    {isExpanded ? '收合 ▲' : '展開查看細節 ▼'}
                  </p>
                )}
              </button>

              {isExpanded && !isEditing && (
                <div className="mt-3 space-y-3 border-t border-sand pt-3 text-sm">
                  <DetailRow label="院所電話" value={record.clinic_phone} />
                  <DetailRow label="院所地址" value={record.clinic_address} />
                  <DetailRow label="飼主姓名" value={record.owner_name} />
                  <DetailRow label="飼主電話" value={record.owner_phone} />
                  <DetailRow label="種類" value={record.species} />
                  <DetailRow
                    label="體重"
                    value={record.weight_grams !== null ? `${record.weight_grams} g` : null}
                  />
                  <DetailRow label="下次複診" value={record.next_visit_date} />
                  <DetailRow label="備註" value={record.notes} />

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => startEdit(record)}
                      className="flex-1 rounded-lg border border-sky py-2 text-xs font-medium text-sky"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      disabled={deletingId === record.id}
                      className="flex-1 rounded-lg border border-coral py-2 text-xs font-medium text-coral-dark disabled:opacity-50"
                    >
                      {deletingId === record.id ? '刪除中...' : '刪除'}
                    </button>
                  </div>
                </div>
              )}

              {isEditing && editDraft && (
                <div className="mt-3 space-y-3 border-t border-sand pt-3">
                  <EditField label="醫院名稱" value={editDraft.clinic_name} onChange={(v) => updateDraftField('clinic_name', v)} />
                  <EditField label="飼主姓名" value={editDraft.owner_name} onChange={(v) => updateDraftField('owner_name', v)} />
                  <EditField label="寵物名字" value={editDraft.pet_name} onChange={(v) => updateDraftField('pet_name', v)} />
                  <div className="grid grid-cols-2 gap-2">
                    <EditField
                      label="就診日期"
                      type="date"
                      value={editDraft.visit_date}
                      onChange={(v) => updateDraftField('visit_date', v)}
                    />
                    <EditField
                      label="下次複診"
                      type="date"
                      value={editDraft.next_visit_date}
                      onChange={(v) => updateDraftField('next_visit_date', v)}
                    />
                  </div>
                  <EditField
                    label="總計金額"
                    type="number"
                    value={editDraft.total_amount !== null ? String(editDraft.total_amount) : null}
                    onChange={(v) => updateDraftField('total_amount', v ? Number(v) : null)}
                  />
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-ink-soft">備註</span>
                    <textarea
                      value={editDraft.notes ?? ''}
                      onChange={(e) => updateDraftField('notes', e.target.value || null)}
                      rows={2}
                      className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                    />
                  </label>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 rounded-lg border border-sand py-2 text-xs font-medium text-ink-soft"
                    >
                      取消
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={savingEdit}
                      className="flex-1 rounded-lg bg-moss py-2 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {savingEdit ? '儲存中...' : '儲存修改'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-xs font-medium text-ink-soft">{label}</span>
      <span className="text-right text-ink">{value}</span>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
      />
    </label>
  );
}