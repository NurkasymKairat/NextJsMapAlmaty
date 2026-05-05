import type { Memory } from './types';

const EARTH_RADIUS_M = 6371000;

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export type Cluster = {
  id: string;
  lat: number;
  lng: number;
  memories: Memory[];
};

export function clusterMemories(memories: Memory[], radiusMeters = 50): Cluster[] {
  const clusters: Cluster[] = [];

  for (const m of memories) {
    let placed = false;
    for (const c of clusters) {
      if (haversine(c, m) <= radiusMeters) {
        c.memories.push(m);
        const n = c.memories.length;
        c.lat = (c.lat * (n - 1) + m.lat) / n;
        c.lng = (c.lng * (n - 1) + m.lng) / n;
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({ id: m.id, lat: m.lat, lng: m.lng, memories: [m] });
    }
  }

  return clusters;
}

export function clusterRadius(count: number): number {
  if (count <= 1) return 12;
  if (count <= 3) return 16;
  if (count <= 6) return 22;
  if (count <= 12) return 28;
  return 34;
}
