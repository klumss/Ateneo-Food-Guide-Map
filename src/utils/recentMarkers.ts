import type { MarkerData } from '../services/markers'

const MAX_RECENT = 5

/**
 * Returns the most recent markers sorted by createdAt descending.
 * Returns at most MAX_RECENT (5) items.
 */
export function getRecentMarkers(markers: MarkerData[]): MarkerData[] {
  return [...markers]
    .filter((m) => m.createdAt != null)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
    .slice(0, MAX_RECENT)
}
