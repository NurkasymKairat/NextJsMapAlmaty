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

const ALMATY_CENTER: [number, number] = [43.222, 76.8512];
const DEFAULT_ZOOM = 12;

function noteSize(count: number): number {
  if (count <= 1) return 30;
  if (count <= 3) return 36;
  if (count <= 6) return 42;
  if (count <= 12) return 50;
  return 58;
}

function tiltFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 11) - 5);
}

function makeMarkerIcon(id: string, color: string, count: number, pulse: boolean): L.DivIcon {
  const size = noteSize(count);
  const tilt = tiltFromId(id);
  const label = count > 1 ? String(count) : '';
  const pulseHtml = pulse
    ? `<span class="memory-marker-pulse" style="background:${color};border-radius:6px"></span>
       <span class="memory-marker-pulse memory-marker-pulse-2" style="background:${color};border-radius:6px"></span>`
    : '';
  const stackHtml =
    count > 1
      ? `<span class="sticky-note-stack" style="background:${color};opacity:0.85;transform:translate(3px,3px) rotate(${tilt + 4}deg)"></span>
         <span class="sticky-note-stack" style="background:${color};opacity:0.92;transform:translate(1.5px,1.5px) rotate(${tilt + 2}deg)"></span>`
      : '';
  return L.divIcon({
    className: 'memory-marker',
    iconSize: [size + 12, size + 12],
    iconAnchor: [(size + 12) / 2, (size + 12) / 2],
    html: `<div class="memory-marker-wrap">${pulseHtml}${stackHtml}<div class="sticky-note" style="width:${size}px;height:${size}px;background:${color};transform:rotate(${tilt}deg)"><span class="sticky-note-count">${label}</span></div></div>`,
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
      className="absolute bottom-24 right-3 z-[500] w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-stone-50 disabled:opacity-50"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          const dominantColor = c.memories.length === 1 ? c.memories[0].color : '#1c1917';
          const pulse = c.memories.some((m) => recentlyAddedIds.has(m.id));
          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={makeMarkerIcon(c.id, dominantColor, c.memories.length, pulse)}
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
              pathOptions={{ color: items[0].color, weight: 3, opacity: 0.7 }}
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

      <ThreadsPanel
        authors={authors}
        visibleIds={visibleAuthors}
        onToggle={toggleAuthor}
        onToggleAll={toggleAll}
      />

      {!user && (
        <a
          href="/login"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] h-12 px-6 rounded-full bg-stone-900 text-white text-sm font-medium shadow-lg flex items-center hover:bg-stone-800"
        >
          Войти, чтобы добавить место
        </a>
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
