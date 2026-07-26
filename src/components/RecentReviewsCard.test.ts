import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getRecentMarkers } from '../utils/recentMarkers'

/**
 * Property-based tests for RecentReviewsCard collapsed state logic.
 *
 * The collapsed card logic (from RecentReviewsCard.tsx):
 *   const recentMarkers = getRecentMarkers(markers)
 *   const displayedMarkers = recentMarkers.slice(0, 3)
 *   header shows: "Recent Reviews ({recentMarkers.length})"
 *
 * **Validates: Requirements 5.5**
 */

// Helper: create a mock Timestamp-like object
const mockTimestamp = (millis: number) => ({ toMillis: () => millis })

// Helper: replicate the collapsed card display logic
function getCollapsedCardState(markers: { id: string; createdAt: { toMillis: () => number } | null }[]) {
  const recentMarkers = getRecentMarkers(markers as any)
  const displayedMarkers = recentMarkers.slice(0, 3)
  return {
    headerCount: recentMarkers.length,
    displayedEntries: displayedMarkers,
  }
}

// Arbitrary: a MarkerData-like object with a valid createdAt
const validMarkerArb = fc
  .record({
    id: fc.uuid(),
    lat: fc.double({ min: 6, max: 8, noNaN: true }),
    lng: fc.double({ min: 124, max: 127, noNaN: true }),
    text: fc.string({ minLength: 1, maxLength: 100 }),
    rating: fc.integer({ min: 1, max: 5 }),
    images: fc.array(fc.webUrl(), { maxLength: 2 }),
    authorId: fc.uuid(),
    createdAt: fc.integer({ min: 1, max: 2_000_000_000_000 }).map((ms) => mockTimestamp(ms)),
  })

// Arbitrary: a MarkerData-like object with null createdAt
const nullTimestampMarkerArb = fc
  .record({
    id: fc.uuid(),
    lat: fc.double({ min: 6, max: 8, noNaN: true }),
    lng: fc.double({ min: 124, max: 127, noNaN: true }),
    text: fc.string({ minLength: 1, maxLength: 100 }),
    rating: fc.integer({ min: 1, max: 5 }),
    images: fc.array(fc.webUrl(), { maxLength: 2 }),
    authorId: fc.uuid(),
    createdAt: fc.constant(null),
  })

describe('RecentReviewsCard - Property Tests', () => {
  /**
   * Property 4: Collapsed card displays correct count and first entries
   *
   * For any array of markers with at least 3 entries having valid createdAt,
   * the collapsed state shows exactly 3 entries matching the first 3 from
   * getRecentMarkers, and the header count equals the total recent markers count.
   *
   * **Validates: Requirements 5.5**
   */
  describe('Property 4: Collapsed card displays correct count and first entries', () => {
    it('collapsed state shows exactly 3 entries when at least 3 markers have valid createdAt', () => {
      // Generate at least 3 valid markers, plus optional null-timestamp markers
      const markersArb = fc.tuple(
        fc.array(validMarkerArb, { minLength: 3, maxLength: 10 }),
        fc.array(nullTimestampMarkerArb, { minLength: 0, maxLength: 5 })
      ).map(([valid, nulls]) => [...valid, ...nulls])

      fc.assert(
        fc.property(markersArb, (markers) => {
          const state = getCollapsedCardState(markers)
          expect(state.displayedEntries).toHaveLength(3)
        }),
        { numRuns: 300 }
      )
    })

    it('displayed 3 entries match the first 3 from getRecentMarkers (same ids, same order)', () => {
      const markersArb = fc.tuple(
        fc.array(validMarkerArb, { minLength: 3, maxLength: 10 }),
        fc.array(nullTimestampMarkerArb, { minLength: 0, maxLength: 5 })
      ).map(([valid, nulls]) => [...valid, ...nulls])

      fc.assert(
        fc.property(markersArb, (markers) => {
          const recentMarkers = getRecentMarkers(markers as any)
          const state = getCollapsedCardState(markers)

          const expectedIds = recentMarkers.slice(0, 3).map((m) => m.id)
          const actualIds = state.displayedEntries.map((m) => m.id)

          expect(actualIds).toEqual(expectedIds)
        }),
        { numRuns: 300 }
      )
    })

    it('header count equals the total number of recent markers (up to 5)', () => {
      const markersArb = fc.tuple(
        fc.array(validMarkerArb, { minLength: 0, maxLength: 10 }),
        fc.array(nullTimestampMarkerArb, { minLength: 0, maxLength: 5 })
      ).map(([valid, nulls]) => [...valid, ...nulls])

      fc.assert(
        fc.property(markersArb, (markers) => {
          const recentMarkers = getRecentMarkers(markers as any)
          const state = getCollapsedCardState(markers)

          expect(state.headerCount).toBe(recentMarkers.length)
          expect(state.headerCount).toBeLessThanOrEqual(5)
        }),
        { numRuns: 300 }
      )
    })

    it('when fewer than 3 markers have valid createdAt, card shows all available entries', () => {
      const markersArb = fc.tuple(
        fc.array(validMarkerArb, { minLength: 0, maxLength: 2 }),
        fc.array(nullTimestampMarkerArb, { minLength: 0, maxLength: 5 })
      ).map(([valid, nulls]) => [...valid, ...nulls])

      fc.assert(
        fc.property(markersArb, (markers) => {
          const recentMarkers = getRecentMarkers(markers as any)
          const state = getCollapsedCardState(markers)

          // When fewer than 3 valid markers, all of them should be displayed
          expect(state.displayedEntries).toHaveLength(Math.min(recentMarkers.length, 3))
          expect(state.displayedEntries.length).toBe(recentMarkers.length)
        }),
        { numRuns: 300 }
      )
    })
  })
})
