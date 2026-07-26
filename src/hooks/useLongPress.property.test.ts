// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import * as fc from 'fast-check'
import { useLongPress } from './useLongPress'

/**
 * Property-based tests for useLongPress hook
 * Validates: Requirements 3.2, 3.3, 4.1
 */

function createTouchEvent(clientX: number, clientY: number): React.TouchEvent {
  return {
    touches: [{ clientX, clientY }],
  } as unknown as React.TouchEvent
}

describe('useLongPress — Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Property 1: Long-press threshold detection', () => {
    /**
     * **Validates: Requirements 3.2, 3.3, 4.1**
     *
     * For any hold duration >= threshold with movement < 10px,
     * onLongPress fires exactly once.
     */
    it('onLongPress fires exactly once when hold duration >= threshold and movement < 10px', () => {
      fc.assert(
        fc.property(
          // Random threshold between 100ms and 2000ms
          fc.integer({ min: 100, max: 2000 }),
          // Random hold duration that is >= threshold (overshoot 0..1000ms)
          fc.integer({ min: 0, max: 1000 }),
          // Random start position
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          // Random movement in range [0, 10] (stays within cancellation threshold)
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 0, max: 10 }),
          (threshold, overshoot, startX, startY, moveX, moveY) => {
            const holdDuration = threshold + overshoot
            const onLongPress = vi.fn()

            const { result } = renderHook(() =>
              useLongPress({ onLongPress, threshold })
            )

            act(() => {
              result.current.onTouchStart(createTouchEvent(startX, startY))
            })

            // Simulate a small move that stays within 10px
            act(() => {
              result.current.onTouchMove(
                createTouchEvent(startX + moveX, startY + moveY)
              )
            })

            // Advance time past the threshold
            act(() => {
              vi.advanceTimersByTime(holdDuration)
            })

            expect(onLongPress).toHaveBeenCalledTimes(1)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * **Validates: Requirements 3.2, 3.3, 4.1**
     *
     * For any hold duration < threshold, onLongPress does not fire.
     */
    it('onLongPress does not fire when hold duration < threshold', () => {
      fc.assert(
        fc.property(
          // Random threshold between 100ms and 2000ms
          fc.integer({ min: 100, max: 2000 }),
          // Random hold duration strictly less than threshold (at least 1ms less)
          fc.integer({ min: 1, max: 1999 }),
          // Random start position
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (threshold, rawDuration, startX, startY) => {
            // Ensure duration is strictly less than threshold
            const holdDuration = rawDuration % threshold || 1

            const onLongPress = vi.fn()

            const { result } = renderHook(() =>
              useLongPress({ onLongPress, threshold })
            )

            act(() => {
              result.current.onTouchStart(createTouchEvent(startX, startY))
            })

            // Advance time but NOT past the threshold
            act(() => {
              vi.advanceTimersByTime(holdDuration)
            })

            // End touch before threshold
            act(() => {
              result.current.onTouchEnd(createTouchEvent(startX, startY))
            })

            expect(onLongPress).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property 2: Long-press cancellation on movement', () => {
    /**
     * **Validates: Requirements 3.2, 3.3, 4.1**
     *
     * For any movement > 10px before threshold elapses,
     * onLongPress never fires regardless of total hold duration.
     */
    it('onLongPress never fires when finger moves > 10px before threshold', () => {
      fc.assert(
        fc.property(
          // Random threshold between 100ms and 2000ms
          fc.integer({ min: 100, max: 2000 }),
          // Random start position
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 0, max: 500 }),
          // Movement > 10px in at least one axis (11..200)
          fc.integer({ min: 11, max: 200 }),
          // Direction for the large movement: 'x', 'y', or 'both'
          fc.constantFrom('x', 'y', 'both'),
          // How much time passes before the move (0 to threshold-1)
          fc.integer({ min: 0, max: 1999 }),
          (threshold, startX, startY, moveDist, direction, rawMoveTime) => {
            const moveTime = rawMoveTime % threshold // Move happens before threshold

            const onLongPress = vi.fn()

            const { result } = renderHook(() =>
              useLongPress({ onLongPress, threshold })
            )

            act(() => {
              result.current.onTouchStart(createTouchEvent(startX, startY))
            })

            // Advance time partially (before threshold, when movement occurs)
            act(() => {
              vi.advanceTimersByTime(moveTime)
            })

            // Move finger beyond 10px cancellation threshold
            const endX =
              direction === 'x' || direction === 'both'
                ? startX + moveDist
                : startX
            const endY =
              direction === 'y' || direction === 'both'
                ? startY + moveDist
                : startY

            act(() => {
              result.current.onTouchMove(createTouchEvent(endX, endY))
            })

            // Advance remaining time well past the threshold
            act(() => {
              vi.advanceTimersByTime(threshold * 2)
            })

            expect(onLongPress).not.toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
