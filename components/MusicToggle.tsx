'use client';

import { useEffect, useRef, useState } from 'react';

const VOLUME_KEY = 'almaty_music_volume';
const TRACK_SRC = '/music.mp3';
const DEFAULT_VOLUME = 0.25;

export default function MusicToggle() {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(TRACK_SRC);
    audio.loop = true;

    let initialVol = DEFAULT_VOLUME;
    try {
      const v = parseFloat(window.localStorage.getItem(VOLUME_KEY) || '');
      if (Number.isFinite(v) && v >= 0 && v <= 1) initialVol = v;
    } catch {}
    audio.volume = initialVol;
    setVolume(initialVol);

    audio.preload = 'auto';
    audioRef.current = audio;
    setReady(true);

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  }

  function changeVolume(v: number) {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
    try {
      window.localStorage.setItem(VOLUME_KEY, String(v));
    } catch {}
  }

  if (!ready) return null;

  return (
    <div className="absolute z-[500] bottom-24 sm:bottom-7" style={{ left: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Музыка"
        className="inline-flex items-center"
        style={{
          background: 'var(--paper-ink)',
          color: 'var(--paper-0)',
          border: 'none',
          borderRadius: 999,
          padding: '10px 18px 10px 14px',
          gap: 12,
          cursor: 'pointer',
          fontFamily: 'var(--font-text)',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: 'var(--shadow-card)',
          maxWidth: 220,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 14,
            color: 'currentColor',
          }}
        >
          <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 4 }} />
          <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 10 }} />
          <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 6 }} />
        </span>
        <span style={{ opacity: 0.92, whiteSpace: 'nowrap' }}>
          {playing ? 'Музыка выставки' : 'Музыка'}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div
            className="modal-card absolute"
            style={{
              bottom: 56,
              left: 0,
              width: 288,
              background: 'var(--paper-0)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--line)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  flexShrink: 0,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: playing ? 'var(--paper-ink)' : 'var(--paper-100)',
                  color: playing ? 'var(--paper-0)' : 'var(--paper-500)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 3, height: 18 }}
                >
                  <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 4 }} />
                  <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 10 }} />
                  <span className={`eq-bar${playing ? '' : ' paused'}`} style={{ height: 6 }} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--paper-ink)',
                    margin: 0,
                  }}
                  className="truncate"
                >
                  Музыка выставки
                </p>
                <p style={{ fontSize: 12, color: 'var(--paper-500)', margin: 0 }}>
                  {playing ? 'Играет' : 'На паузе'}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? 'Пауза' : 'Воспроизвести'}
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--paper-ink)',
                  color: 'var(--paper-0)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {playing ? <PauseIcon /> : <PlayIcon />}
              </button>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span className="label" style={{ margin: 0 }}>
                  Громкость
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--paper-500)' }}
                >
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <VolumeMinIcon />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--paper-ink)', cursor: 'pointer' }}
                  aria-label="Громкость"
                />
                <VolumeMaxIcon />
              </div>
            </div>

            <p
              style={{
                fontSize: 11,
                color: 'var(--paper-400)',
                marginTop: 12,
                lineHeight: 1.45,
              }}
            >
              Звук — часть выставки. Можно выключить, можно сделать тише.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function VolumeMinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-stone-400 flex-shrink-0"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    </svg>
  );
}

function VolumeMaxIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-stone-400 flex-shrink-0"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
