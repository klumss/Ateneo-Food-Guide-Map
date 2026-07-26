# UI Layout Revamp — Visual Bugs Bugfix Design

## Overview

Three visual bugs were introduced during the UI layout revamp: (1) the campus polygon is a simple rectangle instead of tracing the actual Ateneo de Davao Jacinto Campus perimeter, (2) markers use a food emoji pill icon (`createFoodMarkerIcon`) instead of the original simple colored dot (`createMarkerIcon`), and (3) the dark tooltip theme CSS (`.review-tooltip.leaflet-tooltip`) is overridden by Leaflet's default styles due to insufficient specificity. This design formalizes the bug conditions and outlines targeted fixes for each.

## Glossary

- **Bug_Condition (C)**: The set of visual rendering states where the output diverges from the intended design — wrong polygon shape, wrong marker icon, or wrong tooltip styling
- **Property (P)**: The desired visual behavior — accurate campus boundary, simple colored dot markers, dark-themed tooltips
- **Preservation**: Existing behaviors that must remain unchanged — double-click to add markers, right-click context menu, tooltip content (text, rating, images), polygon overlay styling (blue fill, dashed border), lightbox on thumbnail click
- **CAMPUS_BOUNDARY**: The `[number, number][]` constant in `MapView.tsx` defining the polygon vertices
- **createFoodMarkerIcon**: The current icon factory in `ReviewMarker.tsx` that generates emoji pill markers
- **createMarkerIcon(isOwn)**: The original icon factory that generated simple 24px colored circles (blue for own, red for others)

## Bug Details

### Bug Condition

The bugs manifest whenever the map renders — all three are static visual regressions that affect every page load regardless of user input.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type MapRenderState
  OUTPUT: boolean
  
  RETURN (input.polygonCoordinates equals RECTANGULAR_COORDS)
         OR (input.markerIconType equals "food-emoji-pill")
         OR (input.tooltipStyleApplied equals false)
END FUNCTION
```

Where:
- `RECTANGULAR_COORDS` = `[[7.0745, 125.6105], [7.0745, 125.6140], [7.0715, 125.6140], [7.0715, 125.6105]]`
- `"food-emoji-pill"` = markers rendered with `createFoodMarkerIcon` (🍽️ + text label)
- `tooltipStyleApplied equals false` = `.review-tooltip.leaflet-tooltip` dark theme not visible

### Examples

- **Bug 1**: Map renders campus polygon as a rectangle; expected an irregular shape following C.M. Recto Ave, R. Magsaysay Rd, E. Jacinto St, and Padre Zamora St
- **Bug 2**: Hovering a cluster of markers shows overlapping emoji pills like `🍽️ Jollibee`, `🍽️ Mang Inasal`; expected small 24px colored dots (blue/red)
- **Bug 3**: Tooltip on hover shows Leaflet's default white background with dark text; expected dark background (#1a2232) with light text (#e6edf3)
- **Edge case**: A marker owned by the current user should show a blue dot; others show red — color differentiation based on `isOwn`

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Double-clicking the map opens the marker creation form at the clicked location
- Right-clicking an own marker shows the edit/delete context menu
- Tooltip content continues to display review text, star rating, and image thumbnails
- Campus boundary polygon retains its overlay styling (blue fill at 15% opacity, dashed border, weight 2)
- Clicking a thumbnail in the tooltip opens the image lightbox
- Zoom and pan behaviors remain unaffected
- RecentReviewsCard functionality remains unchanged

**Scope:**
All inputs that do NOT relate to these three visual rendering issues should be completely unaffected by this fix. This includes:
- All user interactions (click, double-click, right-click, scroll)
- Marker CRUD operations (create, edit, delete)
- Stats badge calculations and display
- Map tile loading and attribution

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Incorrect Polygon Coordinates (Bug 1)**: The `CAMPUS_BOUNDARY` constant in `MapView.tsx` uses only 4 points forming a rectangle. The original design document specified these as "approximate" placeholders. They were never updated with the actual irregular campus perimeter coordinates.

2. **Wrong Icon Factory (Bug 2)**: During the revamp, `createFoodMarkerIcon` replaced the original `createMarkerIcon(isOwn)`. The original function created a simple `L.divIcon` with a colored circle div. The revamp introduced the emoji pill design which causes visual clutter when markers are dense.

3. **CSS Specificity Defeated (Bug 3)**: Leaflet injects its own tooltip styles with selectors like `.leaflet-tooltip` which have base specificity. The custom `.review-tooltip.leaflet-tooltip` selector in `App.css` should theoretically be higher specificity, but the current CSS only has `.leaflet-tooltip` without the compound `.review-tooltip` class, meaning it overrides globally rather than targeting the review tooltips specifically. Additionally, Leaflet's built-in stylesheet may load after the app stylesheet, causing cascade order to override custom styles. Using `!important` on critical properties or increasing selector specificity would resolve this.

4. **Global tooltip override not sufficient**: The current `App.css` targets `.leaflet-tooltip` globally which partly works, but the tooltip arrow (`::before` pseudo-elements) and the background may still inherit from Leaflet's embedded styles depending on load order.

## Correctness Properties

Property 1: Bug Condition - Campus Polygon Accuracy

_For any_ map render where the campus boundary polygon is displayed, the polygon coordinates SHALL trace the actual Ateneo de Davao Jacinto Campus perimeter as an irregular shape with vertices following C.M. Recto Avenue, R. Magsaysay Road, E. Jacinto Street, and Padre Zamora Street (more than 4 vertices, non-rectangular).

**Validates: Requirements 2.1**

Property 2: Bug Condition - Marker Icon Style

_For any_ marker rendered on the map, the icon SHALL be a simple 24px circle with white border and box-shadow — blue (#3b82f6) for the current user's markers and red (#ef4444) for other users' markers — regardless of marker density or text content.

**Validates: Requirements 2.2**

Property 3: Bug Condition - Tooltip Dark Theme

_For any_ marker tooltip displayed on hover, the tooltip SHALL render with a dark background (#1a2232), light text (#e6edf3), rounded corners (8px radius), and proper contrast, overriding Leaflet's default light theme.

**Validates: Requirements 2.3**

Property 4: Preservation - Existing Interactions

_For any_ input that is NOT related to polygon coordinates, marker icon styling, or tooltip CSS (mouse clicks, double-clicks, right-click menus, form submissions, lightbox opens), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `src/components/MapView.tsx`

**Constant**: `CAMPUS_BOUNDARY`

**Specific Changes**:
1. **Replace rectangular coordinates with actual campus perimeter**: Update the `CAMPUS_BOUNDARY` array from 4 rectangular points to ~10-14 vertices tracing the actual irregular campus shape along the surrounding streets.

   New approximate coordinates (tracing clockwise from northwest):
   ```typescript
   const CAMPUS_BOUNDARY: [number, number][] = [
     [7.0755, 125.6103],  // NW corner — C.M. Recto Ave / R. Magsaysay Rd intersection
     [7.0757, 125.6115],  // North edge along R. Magsaysay Rd
     [7.0753, 125.6128],  // NE area along R. Magsaysay Rd
     [7.0748, 125.6138],  // NE corner — R. Magsaysay Rd / E. Jacinto St
     [7.0738, 125.6142],  // East edge along E. Jacinto St
     [7.0725, 125.6145],  // SE corner — E. Jacinto St / Padre Zamora St
     [7.0715, 125.6140],  // South edge along Padre Zamora St
     [7.0708, 125.6130],  // SW area along Padre Zamora St
     [7.0707, 125.6118],  // South edge — M. Roxas Ave / campus south
     [7.0710, 125.6105],  // SW corner — campus south / C.M. Recto Ave
     [7.0720, 125.6100],  // West edge along C.M. Recto Ave
     [7.0735, 125.6098],  // West edge along C.M. Recto Ave
     [7.0748, 125.6100],  // NW approach back to start
   ]
   ```

---

**File**: `src/components/ReviewMarker.tsx`

**Function**: `createFoodMarkerIcon` → replace with `createMarkerIcon`

**Specific Changes**:
2. **Remove `createFoodMarkerIcon` function entirely**
3. **Add `createMarkerIcon(isOwn: boolean)` function** that returns a `L.DivIcon` with a simple colored circle:
   ```typescript
   function createMarkerIcon(isOwn: boolean): L.DivIcon {
     const color = isOwn ? '#3b82f6' : '#ef4444'
     return L.divIcon({
       className: 'simple-marker',
       html: `<div style="
         width: 24px;
         height: 24px;
         border-radius: 50%;
         background: ${color};
         border: 3px solid white;
         box-shadow: 0 2px 6px rgba(0,0,0,0.3);
       "></div>`,
       iconSize: [24, 24],
       iconAnchor: [12, 12],
     })
   }
   ```
4. **Update icon usage**: Change `const icon = createFoodMarkerIcon(marker.text)` to `const icon = createMarkerIcon(isOwn)`

---

**File**: `src/App.css`

**Section**: Leaflet Tooltip Dark Theme

**Specific Changes**:
5. **Increase tooltip CSS specificity**: Replace the current `.leaflet-tooltip` rules with higher-specificity selectors and add `!important` on critical properties to defeat Leaflet's inline/injected styles:
   ```css
   /* ===== Review Tooltip Dark Theme ===== */
   .leaflet-tooltip.review-tooltip {
     background: #1a2232 !important;
     color: #e6edf3 !important;
     border: 1px solid rgba(48, 54, 61, 0.8) !important;
     border-radius: 8px !important;
     padding: 8px 12px;
     box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
     font-size: 14px;
   }

   .leaflet-tooltip.review-tooltip::before {
     border-top-color: #1a2232 !important;
   }

   .leaflet-tooltip-top.review-tooltip::before {
     border-top-color: #1a2232 !important;
   }

   .leaflet-tooltip-bottom.review-tooltip::before {
     border-bottom-color: #1a2232 !important;
   }

   .leaflet-tooltip-left.review-tooltip::before {
     border-left-color: #1a2232 !important;
   }

   .leaflet-tooltip-right.review-tooltip::before {
     border-right-color: #1a2232 !important;
   }
   ```

6. **Remove food marker CSS**: Delete the `.food-marker`, `.food-marker-content`, `.food-marker-icon`, and `.food-marker-label` classes since they are no longer used.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that verify the polygon coordinates, marker icon output, and tooltip class application. Run these tests on the UNFIXED code to observe failures and understand the root causes.

**Test Cases**:
1. **Polygon Shape Test**: Assert that `CAMPUS_BOUNDARY` has more than 4 vertices and is not rectangular (will fail on unfixed code — currently 4 vertices)
2. **Marker Icon Type Test**: Assert that `createMarkerIcon(true)` returns a div with a colored circle and no emoji (will fail on unfixed code — `createFoodMarkerIcon` returns emoji pill)
3. **Marker Color Test**: Assert blue color for `isOwn=true`, red for `isOwn=false` (will fail — current function ignores `isOwn`)
4. **Tooltip Class Test**: Assert that the Tooltip component passes `className="review-tooltip"` and that matching CSS rules exist with sufficient specificity (will fail — current CSS targets `.leaflet-tooltip` generically)

**Expected Counterexamples**:
- `CAMPUS_BOUNDARY.length === 4` (rectangular, not irregular)
- `createFoodMarkerIcon("test").options.html` contains `🍽️` emoji
- Tooltip background computed style is not `#1a2232`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.type == "polygon":
    ASSERT CAMPUS_BOUNDARY.length > 4
    ASSERT isIrregularShape(CAMPUS_BOUNDARY)
  IF input.type == "marker":
    result := createMarkerIcon(input.isOwn)
    ASSERT result.html CONTAINS "border-radius: 50%"
    ASSERT result.html CONTAINS (isOwn ? "#3b82f6" : "#ef4444")
    ASSERT result.html NOT CONTAINS "🍽️"
  IF input.type == "tooltip":
    ASSERT CSS_RULE(".leaflet-tooltip.review-tooltip").background == "#1a2232"
    ASSERT CSS_RULE(".leaflet-tooltip.review-tooltip").color == "#e6edf3"
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT originalBehavior(input) = fixedBehavior(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for mouse clicks, context menus, tooltip content rendering, and lightbox interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Double-Click Preservation**: Verify double-clicking the map still triggers `onMapDoubleClick` callback with correct coordinates
2. **Context Menu Preservation**: Verify right-clicking an own marker still shows edit/delete menu
3. **Tooltip Content Preservation**: Verify tooltip still renders review text, StarRating, and image thumbnails
4. **Lightbox Preservation**: Verify clicking a tooltip thumbnail still opens the ImageLightbox
5. **Polygon Overlay Style Preservation**: Verify the polygon retains `fillColor: '#2563eb'`, `fillOpacity: 0.15`, `dashArray: '6 4'`

### Unit Tests

- Test `createMarkerIcon(true)` returns HTML with blue circle and 24px dimensions
- Test `createMarkerIcon(false)` returns HTML with red circle and 24px dimensions
- Test `CAMPUS_BOUNDARY` has > 4 vertices and covers expected lat/lng range
- Test that tooltip CSS specificity with `.leaflet-tooltip.review-tooltip` selector is higher than `.leaflet-tooltip`

### Property-Based Tests

- Generate random `isOwn` boolean values and verify `createMarkerIcon` always returns correct color (blue for true, red for false) with consistent 24px circle format
- Generate random marker text strings and verify icon output never contains emoji characters or text labels
- Generate random polygon vertex counts and verify the boundary is non-rectangular (no axis-aligned bounding box match)

### Integration Tests

- Test full map render with polygon visible and non-rectangular shape
- Test marker hover shows dark-themed tooltip with correct content
- Test multiple markers at various zoom levels display as small dots without overlap issues
- Test the map still allows double-click creation and right-click context menu after all fixes
