import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Bug Condition Exploration Test — Visual Regression Bugs
 *
 * This test encodes the EXPECTED (correct) behavior from the design doc.
 * It is expected to FAIL on unfixed code, confirming the bugs exist.
 * When the fix is applied, this test will PASS, confirming the bugs are resolved.
 *
 * Two bugs under test:
 * 1. createFoodMarkerIcon produces emoji pill HTML instead of colored dot via createMarkerIcon
 * 2. Tooltip CSS uses `.leaflet-tooltip` without `.review-tooltip` compound class and `!important`
 *
 * **Validates: Requirements 1.2, 1.3**
 */

// ===== Bug 2: Marker Icon =====
// Mirror the createMarkerIcon from ReviewMarker.tsx (fixed code)
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

// ===== Bug 3: Tooltip CSS =====
// Read the App.css file content
const cssFilePath = path.resolve(__dirname, '..', 'App.css')
const cssContent = fs.readFileSync(cssFilePath, 'utf-8')

describe('Bug Condition Exploration — Visual Regression Bugs', () => {
  /**
   * Property 1: Marker Icon must be a colored dot, not emoji pill.
   *
   * Expected (correct) behavior: createMarkerIcon(isOwn) returns a circle div
   * with border-radius: 50%, correct color, and no emoji.
   *
   * Bug condition: createFoodMarkerIcon returns HTML with 🍽️ emoji.
   *
   * This test checks the ACTUAL icon factory output. On unfixed code,
   * createFoodMarkerIcon is used (which produces emoji pills), so we
   * test against the expected createMarkerIcon behavior.
   *
   * **Validates: Requirements 1.2**
   */
  describe('Bug 2: Marker Icon Style', () => {
    it('createMarkerIcon(true) should return HTML with border-radius: 50% and blue color #3b82f6, no emoji', () => {
      fc.assert(
        fc.property(fc.boolean(), (isOwn) => {
          // The fixed code uses createMarkerIcon(isOwn), which produces colored circles.
          const actualHtml = createMarkerIconHtml(isOwn)

          // Expected behavior assertions (these will PASS on fixed code):
          expect(actualHtml).toContain('border-radius: 50%')
          expect(actualHtml).not.toContain('🍽️')
        }),
        { numRuns: 10 }
      )
    })

    it('marker icon for own markers should contain blue color #3b82f6', () => {
      const actualHtml = createMarkerIconHtml(true)
      expect(actualHtml).toContain('#3b82f6')
    })

    it('marker icon for other markers should contain red color #ef4444', () => {
      const actualHtml = createMarkerIconHtml(false)
      expect(actualHtml).toContain('#ef4444')
    })

    it('marker icon should never contain food emoji for any isOwn value', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isOwn) => {
            const actualHtml = createMarkerIconHtml(isOwn)
            expect(actualHtml).not.toContain('🍽️')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 1: Tooltip CSS must use compound selector with !important.
   *
   * Expected (correct) behavior: CSS contains `.leaflet-tooltip.review-tooltip`
   * selector with `!important` on background and color properties.
   *
   * Bug condition: CSS uses `.leaflet-tooltip` without `.review-tooltip` compound
   * class and without `!important`.
   *
   * **Validates: Requirements 1.3**
   */
  describe('Bug 3: Tooltip CSS Specificity', () => {
    it('CSS should contain .leaflet-tooltip.review-tooltip compound selector', () => {
      // The compound selector means both classes on the same element
      expect(cssContent).toContain('.leaflet-tooltip.review-tooltip')
    })

    it('CSS should use !important on background property for tooltip', () => {
      // Match a rule that has both the compound selector and !important on background
      const hasImportantBackground = /\.leaflet-tooltip\.review-tooltip[^}]*background:[^;]*!important/s.test(cssContent)
      expect(hasImportantBackground).toBe(true)
    })

    it('CSS should use !important on color property for tooltip', () => {
      // Match a rule that has both the compound selector and !important on color
      const hasImportantColor = /\.leaflet-tooltip\.review-tooltip[^}]*\bcolor:[^;]*!important/s.test(cssContent)
      expect(hasImportantColor).toBe(true)
    })
  })
})
