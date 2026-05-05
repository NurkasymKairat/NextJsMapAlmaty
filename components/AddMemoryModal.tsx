'use client';

import { useEffect, useRef, useState } from 'react';
import { MAX_ASSOCIATION_LEN } from '@/lib/validation';

type Props = {
  lat: number;
  lng: number;
  onCancel: () => void;
  onSubmit: (text: string) => Promise<void>;
};

export default function AddMemoryModal({ lat, lng, onCancel, onSubmit }: Props) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

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

  const counterColor = text.length > MAX_ASSOCIATION_LEN - 20 ? 'var(--warn)' : 'var(--paper-400)';

  return (
    <div
      className="fixed inset-0 z-[1000]"
      onClick={onCancel}
    >
      <div
        className="modal-backdrop absolute inset-0"
        style={{ background: 'rgba(28,22,12,0.32)', backdropFilter: 'blur(2px)' }}
      />
      <div
        className="sheet absolute left-0 right-0 bottom-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 460,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            background: 'var(--paper-0)',
            borderRadius: '20px 20px 0 0',
            padding: '20px 22px 22px',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 999,
              background: 'var(--paper-200)',
              margin: '-4px auto 14px',
            }}
          />

          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--paper-500)',
              letterSpacing: '0.06em',
              marginBottom: 14,
            }}
          >
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>

          <h3
            className="display"
            style={{
              fontSize: 22,
              margin: '0 0 12px',
              fontWeight: 400,
              letterSpacing: '-0.01em',
            }}
          >
            Что для вас здесь?
          </h3>

          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_ASSOCIATION_LEN))}
            maxLength={MAX_ASSOCIATION_LEN}
            rows={5}
            placeholder="Воспоминание, чувство, маленькая история…"
            className="field"
            style={{
              resize: 'none',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              gap: 12,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, color: counterColor }}
            >
              {text.length} / {MAX_ASSOCIATION_LEN}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className="btn btn--ghost"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !text.trim()}
                className="btn btn--primary"
              >
                {submitting ? '…' : 'Оставить'}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--error)',
                marginTop: 10,
              }}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
