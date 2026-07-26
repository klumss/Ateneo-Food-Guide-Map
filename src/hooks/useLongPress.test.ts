// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLongPress } from './useLongPress'

function createTouchEvent(clientX: number, clientY: number): React.TouchEvent {
  return {
    touches: [{ clientX, clientY }],
  } as unknown as React.TouchEvent
}

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('invokes onLongPress after threshold elapses without movement', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress }))

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('does not invoke onLongPress before threshold', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress }))

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('uses custom threshold', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, threshold: 300 })
    )

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('cancels long-press when finger moves more than 10px', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress }))

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      result.current.onTouchMove(createTouchEvent(111, 100))
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('does not cancel when finger moves 10px or less', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress }))

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      result.current.onTouchMove(createTouchEvent(110, 100))
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it('invokes onTap when touch ends before threshold', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onTap })
    )

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 100))
    })

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('does not invoke onTap after a successful long-press', () => {
    const onLongPress = vi.fn()
    const onTap = vi.fn()
    const { result } = renderHook(() =>
      useLongPress({ onLongPress, onTap })
    )

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 100))
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onTap).not.toHaveBeenCalled()
  })

  it('does not invoke onTap if not provided', () => {
    const onLongPress = vi.fn()
    const { result } = renderHook(() => useLongPress({ onLongPress }))

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100))
    })

    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 100))
    })

    // Should not throw
    expect(onLongPress).not.toHaveBeenCalled()
  })
})
