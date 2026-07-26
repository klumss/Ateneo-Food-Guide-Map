import { useRef, useCallback } from 'react'

export interface UseLongPressOptions {
  threshold?: number // ms, default 500
  onLongPress: (event: React.TouchEvent | TouchEvent) => void
  onTap?: () => void
}

export interface UseLongPressReturn {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onTap,
}: UseLongPressOptions): UseLongPressReturn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }
      isLongPressRef.current = false

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true
        onLongPress(e)
      }, threshold)
    },
    [onLongPress, threshold]
  )

  const onTouchEnd = useCallback(
    (_e: React.TouchEvent) => {
      if (!isLongPressRef.current && onTap) {
        onTap()
      }
      clear()
    },
    [clear, onTap]
  )

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!startPosRef.current) return
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      // Cancel if finger moves more than 10px (user is panning)
      if (dx > 10 || dy > 10) {
        clear()
      }
    },
    [clear]
  )

  return { onTouchStart, onTouchEnd, onTouchMove }
}
