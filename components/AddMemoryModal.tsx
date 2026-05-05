'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_ASSOCIATION_LEN } from '@/lib/validation';

type Props = {
  lat: number;
  lng: number;
  onCancel: () => void;
  onSubmit: (text: string) => Promise<void>;
};

const PROMPTS = [
  'Что здесь для вас?',
  'Какое воспоминание здесь живёт?',
  'Что вы чувствуете, проходя здесь?',
];

export default function AddMemoryModal({ lat, lng, onCancel, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 220);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Напишите ассоциацию');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadeIn_180ms_ease-out]"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-[slideUp_240ms_cubic-bezier(0.2,0.9,0.3,1.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold tracking-tight">{prompt}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-900 -mt-1 -mr-1 w-11 h-11 flex items-center justify-center"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-stone-500 mb-4 font-mono">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>

        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_ASSOCIATION_LEN))}
          maxLength={MAX_ASSOCIATION_LEN}
          rows={4}
          placeholder="Воспоминание, ассоциация, чувство…"
          className="w-full p-3 rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-base resize-none"
        />
        <div className="flex items-center justify-between mt-2 mb-4">
          <span className="text-xs text-stone-400 tabular-nums">
            {text.length} / {MAX_ASSOCIATION_LEN}
          </span>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 h-12 rounded-lg border border-stone-300 hover:bg-stone-100 disabled:opacity-50 transition"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="flex-1 h-12 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? '…' : 'Оставить'}
          </button>
        </div>
      </div>
    </div>
  );
}
