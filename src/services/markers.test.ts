import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { validateMarkerForm, type MarkerFormData } from './markers'

/**
 * Property-based tests for validateMarkerForm.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

// Helper: create a mock File object for testing
function createMockFile(name = 'test.png'): File {
  return new File(['content'], name, { type: 'image/png' })
}

// Arbitrary: generates a valid non-empty text (1-500 chars after trim)
const validTextArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.trim().length > 0 && s.trim().length <= 500)

// Arbitrary: generates an integer rating in [1, 5]
const validRatingArb = fc.integer({ min: 1, max: 5 })

// Arbitrary: generates 0-2 mock files
const validImagesArb = fc
  .integer({ min: 0, max: 2 })
  .map((count) => Array.from({ length: count }, (_, i) => createMockFile(`img${i}.png`)))

describe('validateMarkerForm - Property Tests', () => {
  /**
   * Property 3: Form validation rejects all invalid inputs
   *
   * For any MarkerFormData where text is empty/whitespace-only OR rating
   * is outside [1,5] OR images count exceeds 2, validateMarkerForm must return false.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 3: Form validation rejects all invalid inputs', () => {
    it('rejects empty or whitespace-only text', () => {
      const whitespaceTextArb = fc.oneof(
        fc.constant(''),
        fc
          .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
          .map((chars) => chars.join(''))
      )

      fc.assert(
        fc.property(
          whitespaceTextArb,
          validRatingArb,
          validImagesArb,
          (text, rating, images) => {
            const data: MarkerFormData = { text, rating, images }
            expect(validateMarkerForm(data)).toBe(false)
          }
        ),
        { numRuns: 200 }
      )
    })

    it('rejects text exceeding 500 characters', () => {
      // Generate a string that, after trim, is still > 500 chars
      const longTextArb = fc
        .string({ minLength: 501, maxLength: 600 })
        .filter((s) => s.trim().length > 500)

      fc.assert(
        fc.property(
          longTextArb,
          validRatingArb,
          validImagesArb,
          (text, rating, images) => {
            const data: MarkerFormData = { text, rating, images }
            expect(validateMarkerForm(data)).toBe(false)
          }
        ),
        { numRuns: 200 }
      )
    })

    it('rejects rating outside [1, 5]', () => {
      const invalidRatingArb = fc.oneof(
        fc.integer({ max: 0 }),
        fc.integer({ min: 6 }),
        fc.double({ min: 1.01, max: 4.99, noNaN: true }).filter(
          (n) => !Number.isInteger(n)
        )
      )

      fc.assert(
        fc.property(
          validTextArb,
          invalidRatingArb,
          validImagesArb,
          (text, rating, images) => {
            const data: MarkerFormData = { text, rating, images }
            expect(validateMarkerForm(data)).toBe(false)
          }
        ),
        { numRuns: 200 }
      )
    })

    it('rejects more than 2 images', () => {
      const tooManyImagesArb = fc
        .integer({ min: 3, max: 10 })
        .map((count) => Array.from({ length: count }, (_, i) => createMockFile(`img${i}.png`)))

      fc.assert(
        fc.property(
          validTextArb,
          validRatingArb,
          tooManyImagesArb,
          (text, rating, images) => {
            const data: MarkerFormData = { text, rating, images }
            expect(validateMarkerForm(data)).toBe(false)
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  /**
   * Property 4: Form validation accepts all valid inputs
   *
   * For any MarkerFormData where text is non-empty (after trim) AND ≤500 chars
   * AND rating is integer in [1,5] AND images count ≤2, validateMarkerForm must return true.
   *
   * **Validates: Requirements 3.4**
   */
  describe('Property 4: Form validation accepts all valid inputs', () => {
    it('accepts any valid MarkerFormData', () => {
      fc.assert(
        fc.property(
          validTextArb,
          validRatingArb,
          validImagesArb,
          (text, rating, images) => {
            const data: MarkerFormData = { text, rating, images }
            expect(validateMarkerForm(data)).toBe(true)
          }
        ),
        { numRuns: 500 }
      )
    })
  })
})
