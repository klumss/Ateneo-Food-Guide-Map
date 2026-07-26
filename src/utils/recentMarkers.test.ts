import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getRecentMarkers } from './recentMarkers'
import type { MarkerData } from '../services/markers'

/**
 * Property-based tests for getRecentMarkers.
 *
 * **Validates: Requirements 5.2**
 */

// Mock Timestamp-like object
const mockTimestamp = (millis: number) => ({ toMillis: () => millis })

// Arbitrary for a MarkerData-like object
const markerArb = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 100 }),
  rating: fc.integer({ min: 1, max: 5 }),
  lat: fc.double({ min: -90, max: 90, noNaN: true }),
  lng: fc.double({ min: -180, max: 180, noNaN: true }),
  images: fc.array(fc.webUrl(), { maxLength: 3 }),
  authorId: fc.uuid(),
  createdAt: fc.oneof(
    fc.integer({ min: 0, max: 2000000000000 }).map(mockTimestamp),
    fc.constant(null),
  ),
}) as fc.Arbitrary<MarkerData>

// Arbitrary that only generates markers with valid (non-null) createdAt
const validMarkerArb = fc.record({
  id: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 100 }),
  rating: fc.integer({ min: 1, max: 5 }),
  lat: fc.double({ min: -90, max: 90, noNaN: true }),
  lng: fc.double({ min: -180, max: 180, noNaN: true }),
  images: fc.array(fc.webUrl(), { maxLength: 3 }),
  authorId: fc.uuid(),
  createdAt: fc.integer({ min: 0, max: 2000000000000 }).map(mockTimestamp),
}) as fc.Arbitrary<MarkerData>

describe('getRecentMarkers - Property Tests', () => {
  /**
   * Property 3: Recent reviews selection and ordering
   *
   * For any array of markers with valid createdAt timestamps, verify:
   * - At most 5 returned
   * - Sorted descending by createdAt
   *
   * **Validates: Requirements 5.2**
   */
  describe('Property 3: Recent reviews selection and ordering', () => {
    it('returns at most 5 markers for any input size', () => {
      fc.assert(
        fc.property(
          fc.array(markerArb, { maxLength: 50 }),
          (markers) => {
            const result = getRecentMarkers(markers)
            expect(result.length).toBeLessThanOrEqual(5)
          },
        ),
        { numRuns: 300 },
      )
    })

    it('returns results sorted descending by createdAt', () => {
      fc.assert(
        fc.property(
          fc.array(validMarkerArb, { minLength: 2, maxLength: 50 }),
          (markers) => {
            const result = getRecentMarkers(markers)
            for (let i = 0; i < result.length - 1; i++) {
              expect(result[i].createdAt.toMillis()).toBeGreaterThanOrEqual(
                result[i + 1].createdAt.toMillis(),
              )
            }
          },
        ),
        { numRuns: 300 },
      )
    })

    it('excludes markers without createdAt (null/undefined)', () => {
      fc.assert(
        fc.property(
          fc.array(markerArb, { maxLength: 50 }),
          (markers) => {
            const result = getRecentMarkers(markers)
            for (const marker of result) {
              expect(marker.createdAt).not.toBeNull()
              expect(marker.createdAt).not.toBeUndefined()
            }
          },
        ),
        { numRuns: 300 },
      )
    })

    it('all returned markers exist in the original array', () => {
      fc.assert(
        fc.property(
          fc.array(markerArb, { maxLength: 50 }),
          (markers) => {
            const result = getRecentMarkers(markers)
            for (const marker of result) {
              expect(markers).toContain(marker)
            }
          },
        ),
        { numRuns: 300 },
      )
    })
  })
})
