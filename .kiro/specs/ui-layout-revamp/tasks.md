# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Visual Regression Bugs (Polygon, Marker Icon, Tooltip CSS)
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the three visual bugs exist
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases:
    - `CAMPUS_BOUNDARY` has only 4 vertices (rectangular)
    - `createFoodMarkerIcon` produces emoji pill HTML instead of colored dot
    - Tooltip CSS uses `.leaflet-tooltip` selector without `.review-tooltip` compound class and `!important`
  - Test assertions (expected correct behavior from design):
    - `CAMPUS_BOUNDARY.length > 4` and polygon is non-rectangular (more than 4 axis-aligned points)
    - `createMarkerIcon(true)` returns HTML with `border-radius: 50%`, color `#3b82f6`, no emoji
    - `createMarkerIcon(false)` returns HTML with `border-radius: 50%`, color `#ef4444`, no emoji
    - CSS file contains `.leaflet-tooltip.review-tooltip` selector with `!important` on `background` and `color`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bugs exist)
  - Document counterexamples found:
    - `CAMPUS_BOUNDARY.length === 4` (rectangular, not irregular campus shape)
    - `createFoodMarkerIcon("test").options.html` contains `🍽️` emoji instead of colored dot
    - CSS uses `.leaflet-tooltip` without `.review-tooltip` compound selector
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Interactions and Behaviors Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Observe on UNFIXED code**:
    - Ownership color logic: `isOwn ? 'blue' : 'red'` context menu gating
    - Context menu shows only for own markers (`marker.authorId === currentUserId`)
    - Tooltip content includes review text, StarRating component, and image thumbnails
    - Polygon overlay options retain `fillColor: '#2563eb'`, `fillOpacity: 0.15`, `dashArray: '6 4'`
    - Double-click handler still calls `onMapDoubleClick` with lat/lng
  - Write property-based tests capturing observed behavior:
    - For all `(authorId, userId)` pairs: ownership color is deterministic (blue iff same, red otherwise)
    - For all `(authorId, userId)` pairs: context menu visible iff authorId === userId
    - For all marker data: tooltip renders review text (truncated at 100 chars), rating, and images
    - Polygon overlay options are unchanged: `fillColor`, `fillOpacity`, `color`, `weight`, `dashArray`
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for visual regression bugs (polygon, marker icon, tooltip CSS)

  - [x] 3.1 Replace `CAMPUS_BOUNDARY` rectangular coordinates with actual campus perimeter
    - In `src/components/MapView.tsx`, replace the 4-point rectangular array with ~13 vertices tracing the actual Ateneo de Davao Jacinto Campus perimeter
    - New vertices follow C.M. Recto Ave, R. Magsaysay Rd, E. Jacinto St, and Padre Zamora St
    - Preserve `CAMPUS_OVERLAY_OPTIONS` object unchanged (fillColor, fillOpacity, dashArray, etc.)
    - _Bug_Condition: isBugCondition(input) where input.polygonCoordinates equals RECTANGULAR_COORDS (4 points)_
    - _Expected_Behavior: CAMPUS_BOUNDARY.length > 4 AND polygon traces irregular campus perimeter_
    - _Preservation: Polygon overlay styling unchanged (fillColor: '#2563eb', fillOpacity: 0.15, dashArray: '6 4')_
    - _Requirements: 2.1, 3.4_

  - [x] 3.2 Remove `createFoodMarkerIcon` and restore `createMarkerIcon(isOwn: boolean)`
    - In `src/components/ReviewMarker.tsx`, delete the `createFoodMarkerIcon` function entirely
    - Add `createMarkerIcon(isOwn: boolean)` that returns `L.divIcon` with a 24px colored circle (blue `#3b82f6` for own, red `#ef4444` for others), white border, box-shadow
    - Update icon usage from `createFoodMarkerIcon(marker.text)` to `createMarkerIcon(isOwn)`
    - _Bug_Condition: isBugCondition(input) where input.markerIconType equals "food-emoji-pill"_
    - _Expected_Behavior: createMarkerIcon(isOwn) returns circle div with correct color, no emoji_
    - _Preservation: Context menu, tooltip content, lightbox behavior all unchanged_
    - _Requirements: 2.2, 3.2, 3.3, 3.5_

  - [x] 3.3 Fix tooltip CSS specificity and remove unused food marker styles
    - In `src/App.css`, replace `.leaflet-tooltip` rules with `.leaflet-tooltip.review-tooltip` selector
    - Add `!important` on `background`, `color`, `border`, and `border-radius` properties
    - Add directional arrow pseudo-element rules (`.leaflet-tooltip-top.review-tooltip::before`, etc.)
    - Remove `.food-marker`, `.food-marker-content`, `.food-marker-icon`, `.food-marker-label` CSS classes
    - _Bug_Condition: isBugCondition(input) where input.tooltipStyleApplied equals false_
    - _Expected_Behavior: .leaflet-tooltip.review-tooltip has background #1a2232 !important, color #e6edf3 !important_
    - _Preservation: All other CSS rules (dashboard, navbar, map-area, responsive) unchanged_
    - _Requirements: 2.3_

  - [x] 3.4 Update `ReviewMarker.test.ts` to test restored `createMarkerIcon` logic
    - Remove the `createFoodMarkerIconHtml` mirror function and its "Marker decluttering" tests
    - Add tests for `createMarkerIcon`: returns 24px circle HTML with blue for `isOwn=true`, red for `isOwn=false`
    - Keep existing ownership color determinism and context menu visibility property tests
    - Keep polygon-related assertions if present
    - _Requirements: 2.2_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Visual Regression Bugs Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied:
      - `CAMPUS_BOUNDARY` has > 4 vertices and is non-rectangular
      - `createMarkerIcon` returns colored circle, no emoji
      - CSS uses `.leaflet-tooltip.review-tooltip` with `!important`
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Interactions Unchanged After Fix
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite (`vitest --run`)
  - Ensure all tests pass, ask the user if questions arise.
