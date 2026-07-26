# Implementation Plan: Mobile Responsive Experience

## Overview

Adapt the Ateneo Food Guide to mobile browsers by adding touch-based interactions (long-press to add markers and access context menus), CSS-only responsive layout changes gated behind `@media (max-width: 768px)`, and touch-friendly sizing for all interactive elements. Desktop behavior remains completely unchanged.

## Tasks

- [x] 1. Create the useLongPress hook and verify viewport meta tag
  - [x] 1.1 Create `src/hooks/useLongPress.ts` with long-press detection logic
    - Implement the `useLongPress` hook with configurable threshold (default 500ms)
    - Include movement cancellation (10px threshold) to avoid triggering during pan/scroll
    - Include optional `onTap` callback for short-tap fallback
    - Export `UseLongPressOptions` and `UseLongPressReturn` interfaces
    - _Requirements: 3.2, 3.3, 4.1_

  - [x] 1.2 Write property tests for useLongPress hook
    - **Property 1: Long-press threshold detection** — for any hold duration >= threshold with movement < 10px, onLongPress fires exactly once; for duration < threshold, it does not fire
    - **Property 2: Long-press cancellation on movement** — for any movement > 10px before threshold, onLongPress never fires
    - **Validates: Requirements 3.2, 3.3, 4.1**

  - [x] 1.3 Verify viewport meta tag in `index.html`
    - Confirm `<meta name="viewport" content="width=device-width, initial-scale=1.0">` exists in the document head
    - Add it if missing
    - _Requirements: 9.1_

- [x] 2. Add mobile map long-press interaction
  - [x] 2.1 Add `MapLongPressHandler` component inside `src/components/MapView.tsx`
    - Create an internal component that attaches touch event listeners to the Leaflet map container
    - On long-press (500ms, single finger, < 10px movement), convert touch position to lat/lng and call `onMapDoubleClick` callback
    - Cancel timer on multi-touch (pinch-to-zoom) or finger movement > 10px
    - Only attach handlers when `pointer: coarse` is detected via `matchMedia`
    - Clean up event listeners on unmount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 1.2, 1.4_

- [x] 3. Add mobile long-press context menu to ReviewMarker
  - [x] 3.1 Update `src/components/ReviewMarker.tsx` with long-press for mobile context menu
    - Attach touch event listeners to owned markers for long-press detection
    - On long-press, open the context menu at touch position (same as right-click behavior)
    - Implement `clampMenuPosition` utility function to prevent menu from overflowing viewport edges
    - Apply clamping to context menu positioning for both desktop and mobile
    - Close context menu on tap outside (add touchstart listener alongside existing click listener)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 1.3_

  - [x] 3.2 Write property test for viewport clamping
    - **Property 3: Context menu viewport clamping** — for any (x, y) position and any menu dimensions, `clampMenuPosition` returns coordinates where menu stays fully within viewport bounds
    - **Validates: Requirements 4.4**

- [x] 4. Update RecentReviewsCard for mobile
  - [x] 4.1 Update `src/components/RecentReviewsCard.tsx` for collapsed-by-default on mobile
    - Detect mobile via `window.matchMedia('(max-width: 768px)')` at initialization
    - Set `expanded` state to `false` on mobile, preserving current behavior on desktop
    - Add `expanded` / collapsed CSS class toggling for conditional display
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Expand CSS media queries for all mobile adaptations
  - [x] 5.1 Update `src/App.css` with comprehensive mobile media query block
    - Add/extend `@media (max-width: 768px)` block with rules for:
      - Navbar: height 48px, reduced font sizes, 44px min-height tap targets for links
      - RecentReviewsCard: 180px max-width, collapsed state hides list, 40vh max-height when expanded, reduced font sizes, 44px min-height buttons
      - MarkerForm: 95vw width, 16px textarea font-size (prevents iOS auto-zoom), 44px button heights, 44px star targets
      - Context menu: 44px min-height/width buttons, larger padding and font-size
    - Ensure no horizontal overflow on the page body
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.2, 5.2, 5.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 5.2 Update `src/components/MarkerForm.tsx` to add CSS class for mobile targeting
    - Add `className` props (`marker-form-overlay`, `marker-form`) to the overlay and form elements so CSS media queries can target them
    - Ensure form container has `overflow-y: auto` for keyboard overlap scrollability on mobile
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 5.3 Update `src/components/StarRating.tsx` for mobile touch targets
    - Add `className` prop (`star-rating`) to the star container for CSS targeting
    - Ensure stars can be styled to 44x44px via the media query in App.css
    - _Requirements: 6.3, 7.1_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration verification and final polish
  - [x] 7.1 Wire all components together and verify desktop preservation
    - Confirm `MapLongPressHandler` is rendered inside `MapContainer` only on touch devices
    - Confirm desktop double-click and right-click behaviors are unchanged
    - Confirm CSS media queries only apply at 768px or below
    - Verify z-index layering: ContextMenu > MarkerForm > RecentReviewsCard > MapView
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3, 9.3_

  - [x] 7.2 Write unit tests for mobile adaptations
    - Test `clampMenuPosition` with edge positions (corners, edges, center)
    - Test RecentReviewsCard collapsed-by-default when matchMedia returns true
    - Test MapLongPressHandler does not attach on non-touch devices
    - _Requirements: 4.4, 5.1, 1.4_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All mobile changes are gated behind CSS media queries or `pointer: coarse` detection — desktop is untouched
- The project uses Vitest + fast-check for testing

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "5.1", "5.2", "5.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "7.1"] },
    { "id": 4, "tasks": ["7.2"] }
  ]
}
```
