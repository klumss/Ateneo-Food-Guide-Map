# Implementation Plan: Interactive Map with Reviews

## Overview

Replace the static map image with an interactive Leaflet map powered by Firestore real-time data. Implementation follows a bottom-up approach: dependencies → config → utilities → service layer → UI components → integration → verification.

## Tasks

- [x] 1. Install dependencies and set up Firebase config
  - [x] 1.1 Install required packages (react-leaflet, leaflet, firebase, @types/leaflet)
    - Run `npm install react-leaflet leaflet firebase` and `npm install -D @types/leaflet`
    - _Requirements: 1.1, 1.3_

  - [x] 1.2 Create Firebase configuration module (src/firebase.ts)
    - Initialize Firebase app with env vars from `.env`
    - Export `db` (Firestore) and `storage` (Firebase Storage) instances
    - _Requirements: 2.5, 4.1_

- [x] 2. Set up user identity and service layer
  - [x] 2.1 Create user identity utility (src/utils/userId.ts)
    - Implement `getUserId()` that generates UUID on first visit and persists in localStorage
    - Key: `ateneo-food-guide-user-id`
    - _Requirements: 6.1, 6.4_

  - [x] 2.2 Create Firestore service layer (src/services/markers.ts)
    - Implement `subscribeToMarkers(callback)` using `onSnapshot`
    - Implement `createMarker(data, position, authorId)` with image upload
    - Implement `updateMarker(markerId, data, authorId)` preserving createdAt
    - Implement `deleteMarker(markerId, authorId)` with image cleanup
    - Implement `uploadMarkerImages(markerId, files)` to Firebase Storage
    - Implement `subscribeToStats(callback)` computing reviews, markers, contributors
    - Implement `validateMarkerForm(data)` returning boolean
    - _Requirements: 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 7.4, 7.5, 8.1, 8.2, 8.3_

  - [x] 2.3 Write property tests for form validation (src/services/markers.test.ts)
    - **Property 3: Form validation rejects all invalid inputs**
    - **Property 4: Form validation accepts all valid inputs**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 2.4 Write property test for contributor count (src/services/markers.test.ts)
    - **Property 5: Distinct contributor count accuracy**
    - **Validates: Requirements 8.3**

- [x] 3. Checkpoint - Core services verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create UI components
  - [x] 4.1 Create StarRating component (src/components/StarRating.tsx)
    - Render 5 clickable stars (filled/empty based on value)
    - Support `readonly` mode for display in popups
    - Support `onChange` callback for interactive mode
    - _Requirements: 2.3, 5.1_

  - [x] 4.2 Create MarkerForm component (src/components/MarkerForm.tsx)
    - Text input with 500-char limit and whitespace validation
    - StarRating integration for rating selection
    - Image file input (max 2 files, accept JPEG/PNG/WebP)
    - Submit and Cancel buttons
    - Pre-fill when editing (accept `existingMarker` prop)
    - Inline validation error display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 3.1, 3.2, 3.3, 3.4, 7.3, 9.4_

  - [x] 4.3 Create ImageLightbox component (src/components/ImageLightbox.tsx)
    - Full-size image in modal overlay
    - Close on click outside or close button
    - _Requirements: 5.2, 5.3_

- [x] 5. Create MapView with markers
  - [x] 5.1 Create MapView component (src/components/MapView.tsx)
    - Render Leaflet map centered on (7.0731, 125.6122) with OSM tiles
    - Handle double-click to trigger marker creation flow
    - Import Leaflet CSS
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [x] 5.2 Create ReviewMarker sub-component (src/components/ReviewMarker.tsx)
    - Render marker with blue (own) or red (others) color based on authorId comparison
    - Show tooltip on hover with review text, star rating, thumbnail images
    - Show context menu on right-click (only for own markers)
    - Context menu with Edit and Delete options
    - Thumbnail click opens ImageLightbox
    - _Requirements: 5.1, 5.2, 6.2, 6.3, 7.1, 7.2_

  - [x] 5.3 Write property test for ownership color determinism
    - **Property 2: Ownership color determinism**
    - **Validates: Requirements 6.2, 6.3**

  - [x] 5.4 Write property test for context menu visibility
    - **Property 6: Context menu visibility is ownership-gated**
    - **Validates: Requirements 7.1, 7.2**

- [x] 6. Checkpoint - Components verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integration and wiring
  - [x] 7.1 Update App.tsx to integrate MapView and live stats
    - Replace static map image with MapView component
    - Subscribe to markers with `subscribeToMarkers`
    - Subscribe to stats with `subscribeToStats` for hero section counts
    - Wire double-click → MarkerForm → createMarker flow
    - Wire edit/delete from ReviewMarker context menu
    - Pass userId and markers to MapView
    - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

  - [x] 7.2 Update App.css with map component styles
    - Map container dimensions (fill section width, appropriate height)
    - MarkerForm popup styling
    - Context menu positioning and appearance
    - Lightbox overlay styling
    - StarRating component styling
    - Tooltip/popup styling
    - _Requirements: 1.1, 5.1_

- [x] 8. Final checkpoint - Build verification
  - [x] 8.1 Run build and verify no TypeScript or bundling errors
    - Execute `npm run build` and confirm clean output
    - Ensure all imports resolve and types are satisfied
    - _Requirements: all_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirement acceptance criteria for traceability
- Checkpoints ensure incremental validation
- The project uses TypeScript with React 19, Vite 8, and modular Firebase v9+
- Leaflet CSS must be imported (either in main.tsx or MapView component)
- Firebase config reads from existing `.env` file with `VITE_` prefixed variables

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4", "4.1", "4.3"] },
    { "id": 4, "tasks": ["4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4"] },
    { "id": 7, "tasks": ["7.1", "7.2"] },
    { "id": 8, "tasks": ["8.1"] }
  ]
}
```
