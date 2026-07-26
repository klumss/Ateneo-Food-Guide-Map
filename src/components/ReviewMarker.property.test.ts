/**
 * @vitest-environment jsdom
 */
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { clampMenuPosition } from './ReviewMarker'

/**
 * Property 3: Context menu viewport clamping
 *
 * For any marker screen position (x, y) and any context menu with dimensions
 * (menuWidth, menuHeight), the `clampMenuPosition` function SHALL return
 * coordinates such that:
 *   - result.x >= 0
 *   - result.y >= 0
 *   - result.x + menuWidth <= viewportWidth
 *   - result.y + menuHeight <= viewportHeight
 *
 * **Validates: Requirements 4.4**
 */
describe('Property 3: Context menu viewport clamping', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clamped position keeps menu fully within viewport bounds for any inputs', () => {
    fc.assert(
      fc.property(
        // Viewport dimensions: positive integers representing pixel sizes
        fc.integer({ min: 1, max: 4000 }), // viewportWidth
        fc.integer({ min: 1, max: 4000 }), // viewportHeight
        // Menu position: can be negative or beyond viewport
        fc.integer({ min: -2000, max: 6000 }), // x
        fc.integer({ min: -2000, max: 6000 }), // y
        // Menu dimensions: positive integers (menu must have some size)
        fc.integer({ min: 1, max: 2000 }), // menuWidth
        fc.integer({ min: 1, max: 2000 }), // menuHeight
        (viewportWidth, viewportHeight, x, y, menuWidth, menuHeight) => {
          // Ensure menu can fit within viewport (precondition)
          fc.pre(menuWidth <= viewportWidth)
          fc.pre(menuHeight <= viewportHeight)

          // Mock window dimensions for this test run
          vi.stubGlobal('innerWidth', viewportWidth)
          vi.stubGlobal('innerHeight', viewportHeight)

          const result = clampMenuPosition(x, y, menuWidth, menuHeight)

          // Property: result.x >= 0
          expect(result.x).toBeGreaterThanOrEqual(0)
          // Property: result.y >= 0
          expect(result.y).toBeGreaterThanOrEqual(0)
          // Property: result.x + menuWidth <= viewportWidth
          expect(result.x + menuWidth).toBeLessThanOrEqual(viewportWidth)
          // Property: result.y + menuHeight <= viewportHeight
          expect(result.y + menuHeight).toBeLessThanOrEqual(viewportHeight)
        }
      ),
      { numRuns: 1000 }
    )
  })

  it('clamped position equals original when menu fits without overflow', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 4000 }), // viewportWidth
        fc.integer({ min: 100, max: 4000 }), // viewportHeight
        fc.integer({ min: 1, max: 500 }), // menuWidth
        fc.integer({ min: 1, max: 500 }), // menuHeight
        (viewportWidth, viewportHeight, menuWidth, menuHeight) => {
          fc.pre(menuWidth <= viewportWidth)
          fc.pre(menuHeight <= viewportHeight)

          // Generate position that already fits within bounds
          const maxX = viewportWidth - menuWidth
          const maxY = viewportHeight - menuHeight
          const x = Math.floor(Math.random() * (maxX + 1))
          const y = Math.floor(Math.random() * (maxY + 1))

          vi.stubGlobal('innerWidth', viewportWidth)
          vi.stubGlobal('innerHeight', viewportHeight)

          const result = clampMenuPosition(x, y, menuWidth, menuHeight)

          // When position already fits, result should equal input
          expect(result.x).toBe(x)
          expect(result.y).toBe(y)
        }
      ),
      { numRuns: 500 }
    )
  })

  it('clamped x is 0 when input x is negative', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 4000 }), // viewportWidth
        fc.integer({ min: 100, max: 4000 }), // viewportHeight
        fc.integer({ min: -5000, max: -1 }), // negative x
        fc.integer({ min: 0, max: 4000 }), // y
        fc.integer({ min: 1, max: 500 }), // menuWidth
        fc.integer({ min: 1, max: 500 }), // menuHeight
        (viewportWidth, viewportHeight, x, y, menuWidth, menuHeight) => {
          fc.pre(menuWidth <= viewportWidth)
          fc.pre(menuHeight <= viewportHeight)

          vi.stubGlobal('innerWidth', viewportWidth)
          vi.stubGlobal('innerHeight', viewportHeight)

          const result = clampMenuPosition(x, y, menuWidth, menuHeight)

          // Negative x should be clamped to 0
          expect(result.x).toBe(0)
        }
      ),
      { numRuns: 500 }
    )
  })

  it('clamped position pushes menu left/up when it would overflow right/bottom edge', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }), // viewportWidth
        fc.integer({ min: 100, max: 2000 }), // viewportHeight
        fc.integer({ min: 1, max: 500 }), // menuWidth
        fc.integer({ min: 1, max: 500 }), // menuHeight
        (viewportWidth, viewportHeight, menuWidth, menuHeight) => {
          fc.pre(menuWidth <= viewportWidth)
          fc.pre(menuHeight <= viewportHeight)

          // Position that would overflow right and bottom edges
          const x = viewportWidth + 100
          const y = viewportHeight + 100

          vi.stubGlobal('innerWidth', viewportWidth)
          vi.stubGlobal('innerHeight', viewportHeight)

          const result = clampMenuPosition(x, y, menuWidth, menuHeight)

          // Should be clamped to max valid position
          expect(result.x).toBe(viewportWidth - menuWidth)
          expect(result.y).toBe(viewportHeight - menuHeight)
        }
      ),
      { numRuns: 500 }
    )
  })
})
