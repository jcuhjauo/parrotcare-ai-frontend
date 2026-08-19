'use client';

import { useRef, useState } from 'react';

type Medication = {
  name: string;
  frequency: string | null;
  duration_days: number | null;
};

type LineItem = {
  item: string;
  amount: number | null;
};

type ScanDraft = {
  clinic_name: string | null;
  clinic_phone: string | null;
  clinic_address: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  pet_name: string | null;
  species: string | null;
  visit_date: string | null;
  weight_grams: number | null;
  medications: Medication[];
  line_items: LineItem[];
  total_amount: number | null;
  next_visit_date: string | null;
  notes: string | null;
  confidence: 'high' | 'medium' | 'low';
};

type ScanResponse = {
  draft: ScanDraft;
  image_path: string;
};

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;

const CONFIDENCE_LABEL: Record<ScanDraft['confidence'], string> = {
  high: '辨識清晰',
  medium: '請核對',
  low: '請仔細確認',
};

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width * scale;
  canvas.height = bitmap.height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('無法取得 canvas context');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('圖片壓縮失敗'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

export default function HealthRecordScanner({ parrotId }: { parrotId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'reviewing' | 'saving' | 'error' | 'saved'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [draft, setDraft] = useState<ScanDraft | null>(null);
  const [imagePath, setImagePath] = useState<string>('');

  const isIdle = status === 'idle';
  const isScanning = status === 'scanning';
  const isReviewing = status === 'reviewing';
  const isSaving = status === 'saving';
  const isError = status === 'error';
  const isSaved = status === 'saved';

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('scanning');
    setErrorMessage('');

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed, 'scan.jpg');
      formData.append('parrot_id', String(parrotId));

      const res = await fetch('/api/records/scan', { method: 'POST', body: formData });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? '辨識失敗，請重新拍攝更清晰的照片');
      }

      const data: ScanResponse = await res.json();
      setDraft(data.draft);
      setImagePath(data.image_path);
      setStatus('reviewing');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '發生未知錯誤');
      setStatus('error');
    }
  }

  function updateField<K extends keyof ScanDraft>(key: K, value: ScanDraft[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      const items = [...prev.line_items];
      items[index] = {
        ...items[index],
        [field]: field === 'amount' ? (value ? Number(value) : null) : value,
      };
      return { ...prev, line_items: items };
    });
  }

  function addLineItem() {
    setDraft((prev) => (prev ? { ...prev, line_items: [...prev.line_items, { item: '', amount: null }] } : prev));
  }

  function removeLineItem(index: number) {
    setDraft((prev) => (prev ? { ...prev, line_items: prev.line_items.filter((_, i) => i !== index) } : prev));
  }

  async function handleConfirm() {
    if (!draft) return;
    setStatus('saving');

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...draft, parrot_id: parrotId, image_path: imagePath, ai_confidence: draft.confidence }),
      });

      if (!res.ok) throw new Error('儲存失敗，請稍後再試');

      setStatus('saved');
      setTimeout(() => {
        setStatus('idle');
        setDraft(null);
      }, 1400);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '儲存失敗');
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-md px-4">
      {isIdle && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-coral py-4 font-medium text-white shadow-[0_6px_0_0_var(--color-coral-dark)] transition active:translate-y-1 active:shadow-none"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          掃描醫療文件
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {isScanning && (
        <div className="space-y-3 rounded-2xl border border-sand bg-white p-5">
          <div className="flex items-center gap-2 text-sm text-moss">
            <span className="h-2 w-2 animate-ping rounded-full bg-moss" />
            AI 辨識中
          </div>
          <div className="h-3 w-2/3 animate-pulse rounded bg-sand" />
          <div className="h-3 w-full animate-pulse rounded bg-sand" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-sand" />
        </div>
      )}

      {isError && (
        <div className="space-y-3 rounded-xl border border-coral/30 bg-coral/10 p-4">
          <p className="text-sm text-coral-dark">{errorMessage}</p>
          <button
            onClick={() => setStatus('idle')}
            className="w-full rounded-lg border border-coral py-2 text-sm font-medium text-coral-dark"
          >
            重新掃描
          </button>
        </div>
      )}

      {isSaved && (
        <div className="rounded-xl border border-moss/30 bg-moss/10 p-4 text-center text-sm font-medium text-moss">
          已儲存這筆健康紀錄
        </div>
      )}

      {isReviewing && draft && (
        <div className="relative overflow-visible rounded-2xl border border-sand bg-white shadow-sm">
          <div
            className="confidence-stamp absolute -right-2 -top-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-coral bg-white text-center text-[10px] font-semibold text-coral-dark"
          >
            {CONFIDENCE_LABEL[draft.confidence]}
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 pt-6">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">
              確認辨識結果
            </p>

            <Section title="院所資訊">
              <Field label="醫院名稱">
                <input
                  value={draft.clinic_name ?? ''}
                  onChange={(e) => updateField('clinic_name', e.target.value || null)}
                  className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                />
              </Field>
              <Field label="電話">
                <input
                  value={draft.clinic_phone ?? ''}
                  onChange={(e) => updateField('clinic_phone', e.target.value || null)}
                  className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                />
              </Field>
              <Field label="地址">
                <input
                  value={draft.clinic_address ?? ''}
                  onChange={(e) => updateField('clinic_address', e.target.value || null)}
                  className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                />
              </Field>
            </Section>

            <Section title="飼主與寵物">
              <div className="grid grid-cols-2 gap-3">
                <Field label="飼主姓名">
                  <input
                    value={draft.owner_name ?? ''}
                    onChange={(e) => updateField('owner_name', e.target.value || null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
                <Field label="飼主電話">
                  <input
                    value={draft.owner_phone ?? ''}
                    onChange={(e) => updateField('owner_phone', e.target.value || null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
                <Field label="寵物名字">
                  <input
                    value={draft.pet_name ?? ''}
                    onChange={(e) => updateField('pet_name', e.target.value || null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
                <Field label="種類">
                  <input
                    value={draft.species ?? ''}
                    onChange={(e) => updateField('species', e.target.value || null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
              </div>
            </Section>

            <Section title="就診資訊">
              <div className="grid grid-cols-2 gap-3">
                <Field label="就診日期">
                  <input
                    type="date"
                    value={draft.visit_date ?? ''}
                    onChange={(e) => updateField('visit_date', e.target.value || null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
                <Field label="體重 (g)">
                  <input
                    type="number"
                    value={draft.weight_grams ?? ''}
                    onChange={(e) => updateField('weight_grams', e.target.value ? Number(e.target.value) : null)}
                    className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                  />
                </Field>
              </div>
              <Field label="下次複診日期">
                <input
                  type="date"
                  value={draft.next_visit_date ?? ''}
                  onChange={(e) => updateField('next_visit_date', e.target.value || null)}
                  className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                />
              </Field>
            </Section>

            <Section title="看診明細">
              <div className="space-y-2">
                {draft.line_items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={item.item}
                      onChange={(e) => updateLineItem(index, 'item', e.target.value)}
                      placeholder="項目名稱"
                      className="flex-1 rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
                    />
                    <input
                      type="number"
                      value={item.amount ?? ''}
                      onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                      placeholder="金額"
                      className="w-24 rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                    />
                    <button
                      onClick={() => removeLineItem(index)}
                      className="px-2 text-sm text-coral-dark"
                      aria-label="刪除這個項目"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={addLineItem}
                  className="text-xs font-medium text-moss"
                >
                  + 新增項目
                </button>
              </div>
              <Field label="總計金額">
                <input
                  type="number"
                  value={draft.total_amount ?? ''}
                  onChange={(e) => updateField('total_amount', e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 font-mono text-sm text-ink outline-none focus:border-coral"
                />
              </Field>
            </Section>

            <Field label="其他備註">
              <textarea
                value={draft.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value || null)}
                rows={2}
                className="w-full rounded-lg border border-sand bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-coral"
              />
            </Field>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStatus('idle')}
                className="flex-1 rounded-xl border border-sand py-3 text-sm font-medium text-ink-soft"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 rounded-xl bg-moss py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {isSaving ? '儲存中...' : '確認儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-sand pt-4 first:border-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-moss">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium tracking-wide text-ink-soft">{label}</span>
      {children}
    </label>
  );
}