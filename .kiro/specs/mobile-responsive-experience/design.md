# Design Document: Mobile Responsive Experience

## Overview

This design adapts the Ateneo Food Guide to mobile browsers by introducing a reusable long-press detection hook, CSS-only responsive layout rules, and component-level changes for touch-friendly interactions. All mobile adaptations are gated behind `@media (max-width: 768px)` queries and a `pointer: coarse` media feature — desktop behavior remains unchanged.

## Architecture

### Approach

The implementation follows a CSS-first philosophy with minimal JavaScript additions:

1. **CSS media queries** handle all layout, sizing, and spacing adaptations.
2. **A single custom React hook** (`useLongPress`) provides long-press detection for both the map and owned markers, replacing desktop's double-click and right-click respectively.
3. **Touch-capability detection** uses `window.matchMedia('(pointer: coarse)')` to conditionally attach long-press handlers, ensuring pointer devices are unaffected.
4. **No resize event listeners** — all layout shifts are declarative CSS.

### File Change Summary

| File | Change Type | Purpose |
|------|-------------|---------|
| `src/hooks/useLongPress.ts` | New | Reusable long-press detection hook |
| `src/components/MapView.tsx` | Modified | Add long-press handler for opening MarkerForm on mobile |
| `src/components/ReviewMarker.tsx` | Modified | Add long-press handler for context menu; viewport-clamp positioning |
| `src/components/RecentReviewsCard.tsx` | Modified | Collapsed-by-default behavior on mobile; mobile-aware initial state |
| `src/components/MarkerForm.tsx` | Modified | Mobile-responsive inline styles + CSS class approach |
| `src/components/Navbar.tsx` | Minor | Ensure tap targets meet 44px minimum |
| `src/components/StarRating.tsx` | Modified | Conditional 44px star sizing on mobile |
| `src/App.css` | Modified | Expanded mobile media query block |
| `src/index.css` | Unchanged | Already provides design tokens |
| `index.html` | Unchanged | Already has correct viewport meta tag |

---

## Components

### 1. `useLongPress` Hook (New)

```typescript
// src/hooks/useLongPress.ts
import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
  threshold?: number // ms, default 500
  onLongPress: (event: React.TouchEvent | TouchEvent) => void
  onTap?: () => void
}

interface UseLongPressReturn {
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
    (e: React.TouchEvent) => {
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
```

**Key Design Decisions:**
- **Movement cancellation (10px threshold):** Prevents accidental long-press triggers while panning the map.
- **Configurable threshold:** Defaults to 500ms per requirement but testable at any value.
- **Tap callback:** Optional short-tap fallback for non-long-press interactions.

---

### 2. MapView Changes

The `MapEventHandler` component is extended to attach long-press detection on touch devices:

```typescript
// Inside MapView.tsx — new component alongside MapEventHandler
function MapLongPressHandler({
  onLongPress,
}: {
  onLongPress: (latlng: { lat: number; lng: number }) => void
}) {
  const map = useMap()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const container = map.getContainer()

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return // ignore multi-touch (pinch)
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = setTimeout(() => {
        const point = L.point(touch.clientX - container.getBoundingClientRect().left,
                              touch.clientY - container.getBoundingClientRect().top)
        const latlng = map.containerPointToLatLng(point)
        onLongPress({ lat: latlng.lat, lng: latlng.lng })
      }, 500)
    }

    const handleTouchEnd = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!startPosRef.current) return
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 10 || dy > 10) {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [map, onLongPress])

  return null
}
```

**Interaction model:**
- Desktop: `dblclick` → opens MarkerForm (unchanged)
- Mobile: long-press (500ms) → opens MarkerForm
- Single tap / double-tap on mobile: no form (avoids conflict with Leaflet zoom)

---

### 3. ReviewMarker Changes

The `ReviewMarker` component adds long-press detection for mobile context menu on owned markers:

```typescript
// Additions to ReviewMarker.tsx
// In the Marker eventHandlers, add touchstart/touchend/touchmove handlers:
eventHandlers={{
  contextmenu: handleContextMenu, // desktop right-click preserved
  // Long-press handlers attached via a wrapper or Leaflet event system
}}
```

**Context menu viewport clamping logic:**

```typescript
function clampMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number
): { x: number; y: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  return {
    x: Math.max(0, Math.min(x, vw - menuWidth)),
    y: Math.max(0, Math.min(y, vh - menuHeight)),
  }
}
```

This pure function is applied when positioning the context menu, ensuring it never overflows viewport edges regardless of where the marker is located on screen.

---

### 4. RecentReviewsCard Changes

```typescript
// Collapsed-by-default on mobile
const isMobile = window.matchMedia('(max-width: 768px)').matches
const [expanded, setExpanded] = useState(!isMobile) // collapsed on mobile, expanded on desktop
```

CSS additions handle max-width (180px), max-height when expanded (40vh), and reduced font sizes.

---

### 5. MarkerForm Changes

Mobile adaptations via CSS class applied conditionally or via media queries in App.css:

- `max-width: 95vw` on the form container
- `font-size: 16px` on textarea (prevents iOS auto-zoom)
- Star rating elements sized to 44x44px
- Buttons with `min-height: 44px`
- Form container gets `overflow-y: auto` for keyboard overlap scrollability

---

### 6. CSS Changes (App.css)

The existing `@media (max-width: 768px)` block is extended:

```css
@media (max-width: 768px) {
  /* Navbar */
  .navbar {
    height: 48px;
    padding: var(--space-xs) var(--space-md);
  }

  .navbar-title {
    font-size: 0.9rem;
  }

  .stat-badge {
    font-size: 0.7rem;
    padding: 2px 8px;
  }

  .navbar-nav a {
    font-size: 0.8rem;
    padding: 10px 8px; /* meets 44px tap target with line-height */
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  /* RecentReviewsCard */
  .recent-reviews-card {
    width: 180px;
    max-width: 180px;
    bottom: 12px;
    right: 12px;
  }

  .recent-reviews-card.expanded {
    max-height: 40vh;
  }

  .recent-reviews-card:not(.expanded) .recent-reviews-list {
    display: none;
  }

  .recent-reviews-header {
    padding: 8px 10px;
    font-size: 0.75rem;
    min-height: 44px;
  }

  .recent-reviews-list button {
    padding: 8px 10px;
    font-size: 0.7rem;
    min-height: 44px;
  }

  /* MarkerForm */
  .marker-form-overlay .marker-form {
    max-width: 95vw;
    width: 95vw;
  }

  .marker-form textarea {
    font-size: 16px;
  }

  .marker-form .star-rating span {
    font-size: 2rem;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .marker-form button {
    min-height: 44px;
  }

  /* Context menu mobile */
  .context-menu button {
    min-height: 44px;
    min-width: 44px;
    padding: 12px 20px;
    font-size: 1rem;
  }
}
```

---

## Data Models

No new data models are introduced. All changes are presentational and interaction-level. The existing `MarkerData`, `MarkerFormData`, `LatLng`, and `MapStats` interfaces remain unchanged.

---

## Interfaces

### `useLongPress` Hook API

```typescript
interface UseLongPressOptions {
  threshold?: number        // Duration in ms (default: 500)
  onLongPress: (event: React.TouchEvent | TouchEvent) => void
  onTap?: () => void        // Optional short-tap callback
}

interface UseLongPressReturn {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
}
```

### `clampMenuPosition` Utility

```typescript
function clampMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number
): { x: number; y: number }
```

### Component Prop Changes

No new props are added to any existing component. The `MapView` component's `onMapDoubleClick` prop is reused for long-press (same callback signature). The `ReviewMarker` component's existing `onEdit` callback is triggered by long-press on mobile in addition to right-click on desktop.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Long-press timer fires after component unmount | Timer cleared in cleanup via `useEffect` return or `useRef` nullification |
| Touch move exceeds threshold mid-press | Timer cancelled, no action fired |
| Multi-touch during long-press (pinch) | Timer cancelled when `e.touches.length !== 1` |
| Context menu positioned near viewport edge | `clampMenuPosition` ensures menu stays in bounds |
| Mobile keyboard overlaps form | Form container uses `overflow-y: auto` for scroll access |
| `matchMedia` not available (SSR) | Fallback to `false` (desktop behavior) |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Long-press threshold detection

*For any* touch interaction on a long-press-enabled target, if the touch duration is greater than or equal to the configured threshold (500ms) and the finger does not move more than 10px from the start position, the `onLongPress` callback SHALL be invoked exactly once. *For any* touch duration less than the threshold, the `onLongPress` callback SHALL NOT be invoked.

**Validates: Requirements 3.2, 3.3, 4.1**

### Property 2: Long-press cancellation on movement

*For any* touch interaction where the finger moves more than 10px from the initial touch position before the threshold elapses, the `onLongPress` callback SHALL NOT be invoked regardless of hold duration.

**Validates: Requirements 3.1, 3.2**

### Property 3: Context menu viewport clamping

*For any* marker screen position `(x, y)` within the viewport bounds, and *for any* context menu with dimensions `(menuWidth, menuHeight)`, the `clampMenuPosition` function SHALL return coordinates such that `result.x >= 0`, `result.y >= 0`, `result.x + menuWidth <= viewportWidth`, and `result.y + menuHeight <= viewportHeight`.

**Validates: Requirements 4.4**

### Property 4: Tap target minimum size

*For any* interactive element (button, link, or marker action target) rendered at a viewport width of 768px or less, the element's computed touch target area SHALL have width >= 44px and height >= 44px.

**Validates: Requirements 7.1, 7.3**

### Property 5: Tap target spacing

*For any* pair of adjacent interactive elements rendered at a viewport width of 768px or less, the distance between their bounding boxes SHALL be at least 8px.

**Validates: Requirements 7.2**
