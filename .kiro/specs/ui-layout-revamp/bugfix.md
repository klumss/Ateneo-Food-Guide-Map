# Bugfix Requirements Document

## Introduction

Three visual bugs in the campus map UI need fixing: an incorrect campus boundary polygon that doesn't match the actual Ateneo de Davao University Jacinto Campus perimeter, cluttered food emoji pill markers that should be reverted to simple colored dots, and tooltip styles that fail to render correctly (dark background/light text not applying to Leaflet tooltips).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the map renders the campus boundary polygon THEN the system displays a simple rectangle (`[7.0745, 125.6105], [7.0745, 125.6140], [7.0715, 125.6140], [7.0715, 125.6105]`) that does not match the actual Ateneo de Davao University Jacinto Campus perimeter

1.2 WHEN multiple markers are close together on the map THEN the system renders food emoji pill markers (`🍽️` + text label) via `createFoodMarkerIcon` that are visually cluttered and overlapping

1.3 WHEN a user hovers over a marker to view its tooltip THEN the system renders the tooltip with a light/default Leaflet background instead of the intended dark theme (#1a2232 background, #e6edf3 text), making text hard to read against the map

### Expected Behavior (Correct)

2.1 WHEN the map renders the campus boundary polygon THEN the system SHALL display a polygon that traces the actual Jacinto Campus perimeter along C.M. Recto Avenue, R. Magsaysay Road, E. Jacinto Street, and Padre Zamora Street, matching the irregular campus shape

2.2 WHEN markers are rendered on the map THEN the system SHALL use the previous colored dot style — a simple 24px circle with white border and box shadow (blue `#3b82f6` for own markers, red `#ef4444` for others) — regardless of marker density

2.3 WHEN a user hovers over a marker to view its tooltip THEN the system SHALL display the tooltip with a dark background (#1a2232), light text (#e6edf3), rounded corners, and proper contrast so text is easily readable against the map

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user double-clicks the map THEN the system SHALL CONTINUE TO open the marker creation form at the clicked location

3.2 WHEN a user right-clicks their own marker THEN the system SHALL CONTINUE TO show the edit/delete context menu

3.3 WHEN a marker's tooltip is displayed THEN the system SHALL CONTINUE TO show the review text, star rating, and image thumbnails within the tooltip

3.4 WHEN the map is zoomed or panned THEN the system SHALL CONTINUE TO display the campus boundary polygon with the existing overlay styling (blue fill at 15% opacity, dashed border)

3.5 WHEN a user clicks a thumbnail in the tooltip THEN the system SHALL CONTINUE TO open the image lightbox
