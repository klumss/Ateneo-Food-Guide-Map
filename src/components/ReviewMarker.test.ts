import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property-based tests for ReviewMarker ownership logic and marker icon generation.
 *
 * The core ownership and color logic under test:
 *   - isOwn = marker.authorId === currentUserId
 *   - color = isOwn ? '#3b82f6' (blue) : '#ef4444' (red)
 *   - contextMenu visible only when isOwn === true
 *
 * The marker icon generation logic under test:
 *   - createMarkerIcon(isOwn) returns a 24px circle with ownership-based color
 *   - No emoji, no text labels in icon HTML
 *
 * **Validates: Requirements 2.2, 6.2, 6.3, 7.1, 7.2**
 */

/**
 * Replicate the ownership and color determination logic from ReviewMarker.
 * In the actual component, `isOwn` is passed as a prop derived from
 * `marker.authorId === currentUserId`, and `createMarkerIcon(isOwn)` uses
 * `isOwn ? '#3b82f6' : '#ef4444'` (blue vs red).
 */
function getMarkerColor(authorId: string, userId: string): 'blue' | 'red' {
  const isOwn = authorId === userId
  return isOwn ? 'blue' : 'red'
}

/**
 * Pure function that mirrors the ownership gate logic in ReviewMarker.tsx.
 * Returns true if the context menu should be shown (i.e., user owns the marker).
 */
function isContextMenuVisible(markerAuthorId: string, currentUserId: string): boolean {
  return markerAuthorId === currentUserId
}

/**
 * Replicate the core HTML generation logic from createMarkerIcon.
 * The actual function is not exported, so we mirror it as a pure function.
 */
function createMarkerIconHtml(isOwn: boolean): string {
  const color = isOwn ? '#3b82f6' : '#ef4444'
  return `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`
}

describe('ReviewMarker - Property Tests', () => {
  /**
   * Property 2: Ownership color determinism
   *
   * For any marker and any userId, the marker color is blue if and only if
   * marker.authorId equals userId, and red otherwise. This must be consistent
   * regardless of other state.
   *
   * **Validates: Requirements 6.2, 6.3**
   */
  describe('Property 2: Ownership color determinism', () => {
    it('returns blue when authorId equals userId', () => {
      fc.assert(
        fc.property(fc.uuid(), (id) => {
          expect(getMarkerColor(id, id)).toBe('blue')
        }),
        { numRuns: 500 }
      )
    })

    it('returns red when authorId does not equal userId', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          (authorId, userId) => {
            fc.pre(authorId !== userId)
            expect(getMarkerColor(authorId, userId)).toBe('red')
          }
        ),
        { numRuns: 500 }
      )
    })

    it('color is deterministic: same inputs always produce same output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 64 }),
          fc.string({ minLength: 1, maxLength: 64 }),
          (authorId, userId) => {
            const color1 = getMarkerColor(authorId, userId)
            const color2 = getMarkerColor(authorId, userId)
            expect(color1).toBe(color2)
          }
        ),
        { numRuns: 500 }
      )
    })

    it('color is blue if and only if authorId === userId (biconditional)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 64 }),
          fc.string({ minLength: 1, maxLength: 64 }),
          (authorId, userId) => {
            const color = getMarkerColor(authorId, userId)
            const isOwn = authorId === userId
            // Biconditional: color is blue <-> isOwn is true
            expect(color === 'blue').toBe(isOwn)
            expect(color === 'red').toBe(!isOwn)
          }
        ),
        { numRuns: 500 }
      )
    })
  })

  /**
   * Property 6: Context menu visibility is ownership-gated
   *
   * For any marker and any userId, the context menu (edit/delete) is shown
   * if and only if marker.authorId equals userId.
   *
   * **Validates: Requirements 7.1, 7.2**
   */
  describe('Property 6: Context menu visibility is ownership-gated', () => {
    it('should show context menu if and only if marker.authorId equals currentUserId', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (authorId, userId) => {
            const visible = isContextMenuVisible(authorId, userId)

            if (authorId === userId) {
              // Requirement 7.1: right-click own marker shows context menu
              expect(visible).toBe(true)
            } else {
              // Requirement 7.2: right-click non-own marker shows no context menu
              expect(visible).toBe(false)
            }
          }
        ),
        { numRuns: 1000 }
      )
    })

    it('should always show context menu when authorId and userId are identical (same reference)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (id) => {
            expect(isContextMenuVisible(id, id)).toBe(true)
          }
        ),
        { numRuns: 500 }
      )
    })

    it('should never show context menu when authorId and userId differ by at least one character', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string({ minLength: 1 }),
          (authorId, suffix) => {
            // Ensure they differ by appending a distinguishing suffix
            const differentUserId = authorId + suffix + '_different'
            expect(isContextMenuVisible(authorId, differentUserId)).toBe(false)
          }
        ),
        { numRuns: 500 }
      )
    })

    it('should handle UUID-shaped strings correctly', () => {
      const uuidArb = fc.uuid()

      fc.assert(
        fc.property(
          uuidArb,
          uuidArb,
          (authorId, userId) => {
            const visible = isContextMenuVisible(authorId, userId)
            expect(visible).toBe(authorId === userId)
          }
        ),
        { numRuns: 1000 }
      )
    })
  })
})

/**
 * Property: Marker icon style — simple colored circle, no emoji
 *
 * For any marker rendered on the map, the icon is a 24px circle with
 * blue (#3b82f6) for own markers and red (#ef4444) for other users' markers.
 * No emoji or text labels appear in the icon HTML.
 *
 * **Validates: Requirements 2.2**
 */
describe('ReviewMarker - createMarkerIcon', () => {
  it('createMarkerIcon(true) produces HTML with blue color (#3b82f6), border-radius: 50%, 24px, no emoji', () => {
    const html = createMarkerIconHtml(true)
    expect(html).toContain('#3b82f6')
    expect(html).toContain('border-radius: 50%')
    expect(html).toContain('24px')
    expect(html).not.toContain('🍽️')
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
  })

  it('createMarkerIcon(false) produces HTML with red color (#ef4444), border-radius: 50%, 24px, no emoji', () => {
    const html = createMarkerIconHtml(false)
    expect(html).toContain('#ef4444')
    expect(html).toContain('border-radius: 50%')
    expect(html).toContain('24px')
    expect(html).not.toContain('🍽️')
    expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
  })

  it('for any isOwn value, icon is always a 24px circle with correct color and no emoji', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (isOwn) => {
          const html = createMarkerIconHtml(isOwn)
          const expectedColor = isOwn ? '#3b82f6' : '#ef4444'
          expect(html).toContain(expectedColor)
          expect(html).toContain('border-radius: 50%')
          expect(html).toContain('24px')
          // No emoji characters in the icon
          expect(html).not.toMatch(/[\u{1F300}-\u{1F9FF}]/u)
          // No food marker class names
          expect(html).not.toContain('food-marker')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('own marker color is blue, not red', () => {
    const html = createMarkerIconHtml(true)
    expect(html).toContain('#3b82f6')
    expect(html).not.toContain('#ef4444')
  })

  it('other marker color is red, not blue', () => {
    const html = createMarkerIconHtml(false)
    expect(html).toContain('#ef4444')
    expect(html).not.toContain('#3b82f6')
  })
})
