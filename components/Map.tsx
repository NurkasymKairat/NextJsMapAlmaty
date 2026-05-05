'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import type { Memory, PublicUser } from '@/lib/types';
import { clusterMemories, clusterRadius, type Cluster } from '@/lib/cluster';
import AddMemoryModal from './AddMemoryModal';
import ThreadsPanel, { type AuthorInfo } from './ThreadsPanel';
import MemoryDetail from './MemoryDetail';
import WelcomeHint from './WelcomeHint';
import MusicToggle from './MusicToggle';

const ALMATY_CENTER: [number, number] = [43.222, 76.8512];
const DEFAULT_ZOOM = 12;

function noteSize(count: number): number {
  if (count <= 1) return 50;
  if (count <= 3) return 56;
  if (count <= 6) return 62;
  return 68;
}

function tiltFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (h % 9) - 4;
}

function escapeAttr(v: string): string {
  return v.replace(/"/g, '&quot;');
}

function singleStickerHtml(color: string, rotate: number, isNew: boolean, mini = false): string {
  const klass = `sticker${isNew ? ' sticker--new' : ''}`;
  const inner = mini
    ? '<span class="sticker-lines"><span style="width:70%"></span><span style="width:50%"></span></span>'
    : '<span class="sticker-lines"><span style="width:80%"></span><span style="width:60%"></span><span style="width:70%"></span></span>';
  return `<div class="${klass}" style="--c:${escapeAttr(color)};--rot:${rotate}deg;width:80%;height:80%;padding:8px">${inner}</div>`;
}

function makeMarkerIcon(id: string, color: string, count: number, pulse: boolean): L.DivIcon {
  const size = noteSize(count);
  const tilt = tiltFromId(id);
  const padding = 16;
  const total = size + padding;

  let html: string;
  if (count <= 1) {
    html = `
      <div style="position:relative;width:${size}px;height:${size}px">
        ${singleStickerHtml(color, tilt, pulse)}
      </div>
    `;
  } else {
    const visible = Math.min(count, 3);
    const stackColors = [color, 'var(--u-08)', 'var(--u-15)'].slice(0, visible);
    const layers = stackColors
      .map((c, i) => {
        const offsetX = (i - 1) * 5;
        const offsetY = (i - 1) * -4;
        const rot = tilt + (i - 1) * 6;
        const klass = `sticker${pulse && i === 0 ? ' sticker--new' : ''}`;
        return `<div class="${klass}" style="--c:${escapeAttr(c)};--rot:${rot}deg;position:absolute;inset:0;width:${size - 8}px;height:${size - 8}px;padding:6px;transform:translate(${offsetX}px,${offsetY}px) rotate(${rot}deg);z-index:${visible - i}">
          <span class="sticker-lines"><span style="width:70%"></span><span style="width:50%"></span></span>
        </div>`;
      })
      .join('');
    html = `
      <div style="position:relative;width:${size}px;height:${size}px">
        ${layers}
        <span class="cluster-count">${count}</span>
      </div>
    `;
  }

  return L.divIcon({
    className: 'memory-marker',
    iconSize: [total, total],
    iconAnchor: [total / 2, total / 2],
    html: `<div style="position:relative;width:${total}px;height:${total}px;display:flex;align-items:center;justify-content:center">${html}</div>`,
  });
}

function makePlacementIcon(): L.DivIcon {
  return L.divIcon({
    className: 'memory-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: '<div class="placement-pulse"></div>',
  });
}

function MapClickHandler({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function LocateControl({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [busy, setBusy] = useState(false);

  function go() {
    if (!navigator.geolocation || busy) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 0.8 });
        onLocate(latitude, longitude);
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      aria-label="Моё местоположение"
      className="absolute z-[500] flex items-center justify-center disabled:opacity-50"
      style={{
        right: 14,
        bottom: 200,
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--paper-0)',
        boxShadow: 'var(--shadow-card)',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--paper-700)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    </button>
  );
}

type Props = {
  user: PublicUser | null;
  initialMemories: Memory[];
};

export default function MemoryMap({ user, initialMemories }: Props) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [openCluster, setOpenCluster] = useState<Memory[] | null>(null);
  const [visibleAuthors, setVisibleAuthors] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set());

  const authors = useMemo<AuthorInfo[]>(() => {
    const map = new globalThis.Map<string, AuthorInfo>();
    for (const m of memories) {
      const a = map.get(m.user_id);
      if (a) {
        a.count += 1;
      } else {
        map.set(m.user_id, {
          id: m.user_id,
          username: m.username,
          color: m.color,
          count: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [memories]);

  useEffect(() => {
    if (initialized) return;
    if (user) setVisibleAuthors(new Set([user.id]));
    setInitialized(true);
  }, [user, initialized]);

  const clusters = useMemo<Cluster[]>(() => clusterMemories(memories, 50), [memories]);

  const threadsByAuthor = useMemo(() => {
    const groups = new globalThis.Map<string, Memory[]>();
    for (const m of memories) {
      const arr = groups.get(m.user_id);
      if (arr) arr.push(m);
      else groups.set(m.user_id, [m]);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => a.order_index - b.order_index);
    }
    return groups;
  }, [memories]);

  const onMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!user) return;
      setPending({ lat, lng });
    },
    [user],
  );

  const submitMemory = useCallback(
    async (text: string) => {
      if (!pending) return;
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pending.lat, lng: pending.lng, association: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Не удалось сохранить');
      const m: Memory = data.memory;
      setMemories((prev) => [...prev, m]);
      setVisibleAuthors((prev) => {
        if (prev.has(m.user_id)) return prev;
        const next = new Set(prev);
        next.add(m.user_id);
        return next;
      });
      setRecentlyAddedIds((prev) => {
        const next = new Set(prev);
        next.add(m.id);
        return next;
      });
      setTimeout(() => {
        setRecentlyAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      }, 12000);
      setPending(null);
    },
    [pending],
  );

  const updateMemory = useCallback((m: Memory) => {
    setMemories((prev) => prev.map((x) => (x.id === m.id ? m : x)));
    setOpenCluster((prev) => prev?.map((x) => (x.id === m.id ? m : x)) ?? null);
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((x) => x.id !== id));
    setOpenCluster((prev) => {
      if (!prev) return null;
      const next = prev.filter((x) => x.id !== id);
      return next.length === 0 ? null : next;
    });
  }, []);

  const toggleAuthor = useCallback((id: string) => {
    setVisibleAuthors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (on: boolean) => {
      setVisibleAuthors(on ? new Set(authors.map((a) => a.id)) : new Set());
    },
    [authors],
  );

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={ALMATY_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        zoomControl={true}
        className="absolute inset-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler enabled={!!user} onClick={onMapClick} />

        {clusters.map((c) => {
          const firstColor = c.memories[0].color;
          const pulse = c.memories.some((m) => recentlyAddedIds.has(m.id));
          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={makeMarkerIcon(c.id, firstColor, c.memories.length, pulse)}
              eventHandlers={{
                click: () => setOpenCluster(c.memories),
              }}
            />
          );
        })}

        {[...threadsByAuthor.entries()].map(([userId, items]) => {
          if (!visibleAuthors.has(userId) || items.length < 2) return null;
          const positions: [number, number][] = items.map((m) => [m.lat, m.lng]);
          return (
            <Polyline
              key={userId}
              positions={positions}
              pathOptions={{
                color: items[0].color,
                weight: 2.5,
                opacity: 1,
                dashArray: '1 6',
                lineCap: 'round',
              }}
            />
          );
        })}

        {pending && (
          <Marker
            position={[pending.lat, pending.lng]}
            icon={makePlacementIcon()}
            interactive={false}
          />
        )}

        <LocateControl onLocate={() => {}} />
      </MapContainer>

      <WelcomeHint user={user} />
      <MusicToggle />

      <ThreadsPanel
        authors={authors}
        visibleIds={visibleAuthors}
        onToggle={toggleAuthor}
        onToggleAll={toggleAll}
      />

      {!user && (
        <div
          className="absolute z-[500]"
          style={{
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--paper-0)',
            borderRadius: 999,
            padding: '8px 8px 8px 18px',
            boxShadow: 'var(--shadow-card)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            color: 'var(--paper-700)',
            fontWeight: 500,
            maxWidth: 'calc(100vw - 28px)',
          }}
        >
          <span style={{ whiteSpace: 'nowrap' }}>Войти, чтобы добавить место</span>
          <a href="/login" className="btn btn--primary" style={{ padding: '8px 14px', fontSize: 13 }}>
            Войти
          </a>
        </div>
      )}

      {pending && (
        <AddMemoryModal
          lat={pending.lat}
          lng={pending.lng}
          onCancel={() => setPending(null)}
          onSubmit={submitMemory}
        />
      )}

      {openCluster && (
        <MemoryDetail
          memories={openCluster}
          user={user}
          onClose={() => setOpenCluster(null)}
          onMemoryUpdate={updateMemory}
          onMemoryDelete={deleteMemory}
        />
      )}
    </div>
  );
}
