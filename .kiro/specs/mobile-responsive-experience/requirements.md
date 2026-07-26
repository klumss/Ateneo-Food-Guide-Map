# Requirements Document

## Introduction

This feature makes the Ateneo Food Guide website fully usable and accessible on mobile phone web browsers while preserving the desktop experience exactly as-is. The mobile experience adapts all existing functionality (map interaction, review submission, recent reviews, marker navigation, edit/delete own markers) to touch-based interfaces with proportionally scaled UI elements that do not block the limited screen real estate.

## Glossary

- **App**: The Ateneo Food Guide single-page React application rendered in a mobile or desktop browser.
- **Mobile_Viewport**: A browser viewport with a width of 768px or less.
- **Desktop_Viewport**: A browser viewport with a width greater than 768px.
- **Navbar**: The top navigation bar displaying the application title, stats badges, and navigation links.
- **MapView**: The Leaflet-based interactive map component that fills the remaining viewport below the Navbar.
- **RecentReviewsCard**: The floating card positioned over the map displaying the most recent user reviews with navigation capability.
- **MarkerForm**: The overlay form used to create or edit a food review marker.
- **ReviewMarker**: A circular map marker representing a user-submitted food review, with context menu for owner actions.
- **ContextMenu**: The popup menu on a ReviewMarker that provides Edit and Delete actions to the marker owner.
- **StarRating**: The interactive star-based rating selector used in MarkerForm and displayed in review tooltips.
- **Long_Press**: A touch gesture where the user holds a finger on a target for at least 500 milliseconds.
- **Tap_Target**: Any interactive element (button, link, marker) that a user taps to trigger an action.

## Requirements

### Requirement 1: Desktop Experience Preservation

**User Story:** As a desktop user, I want the website to look and behave exactly as it does today, so that the mobile adaptation does not degrade my experience.

#### Acceptance Criteria

1. WHILE the App is rendered in a Desktop_Viewport, THE App SHALL display all components with identical layout, sizing, spacing, and interaction behavior as the current implementation.
2. WHILE the App is rendered in a Desktop_Viewport, THE App SHALL preserve double-click on the MapView as the trigger to open the MarkerForm.
3. WHILE the App is rendered in a Desktop_Viewport, THE App SHALL preserve right-click on an owned ReviewMarker as the trigger to open the ContextMenu.
4. THE App SHALL apply mobile-specific style changes exclusively through CSS media queries targeting viewports of 768px or less or through touch-capability detection that does not alter pointer-based device rendering.

### Requirement 2: Mobile Navbar Adaptation

**User Story:** As a mobile user, I want the Navbar to be compact and readable on a small screen, so that it does not consume excessive vertical space while still showing the title and stats.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE Navbar SHALL reduce its height to no more than 48px.
2. WHILE the App is rendered in a Mobile_Viewport, THE Navbar SHALL display the application title with a font size between 0.85rem and 1rem.
3. WHILE the App is rendered in a Mobile_Viewport, THE Navbar SHALL display stat badges with reduced padding and font size proportional to the viewport.
4. WHILE the App is rendered in a Mobile_Viewport, THE Navbar SHALL not overflow horizontally or cause content to wrap to a second line.

### Requirement 3: Mobile Map Interaction

**User Story:** As a mobile user, I want to interact with the map using touch gestures, so that I can pan, zoom, and add markers without a mouse.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL support pinch-to-zoom and drag-to-pan touch gestures.
2. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL open the MarkerForm when the user performs a Long_Press on an empty area of the map.
3. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL not open the MarkerForm on a single tap or double-tap to avoid conflicting with zoom gestures.
4. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL center on the same default coordinates and zoom level as the desktop version.

### Requirement 4: Mobile Context Menu for Own Markers

**User Story:** As a mobile user who has submitted a review, I want to edit or delete my marker using a touch gesture, so that I have the same owner capabilities as desktop users.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE ReviewMarker SHALL open the ContextMenu when the owner performs a Long_Press on the marker.
2. WHILE the App is rendered in a Mobile_Viewport, THE ContextMenu SHALL display Edit and Delete buttons with a minimum Tap_Target size of 44x44 pixels.
3. WHILE the App is rendered in a Mobile_Viewport, THE ContextMenu SHALL close when the user taps outside of the menu area.
4. WHILE the App is rendered in a Mobile_Viewport, THE ContextMenu SHALL be positioned so that it does not overflow beyond the visible viewport edges.

### Requirement 5: Mobile RecentReviewsCard

**User Story:** As a mobile user, I want the Recent Reviews card to be compact and expandable, so that it does not block the map when I am exploring.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE RecentReviewsCard SHALL display in a collapsed state by default showing only the header.
2. WHILE the App is rendered in a Mobile_Viewport, THE RecentReviewsCard SHALL have a maximum width of 180px.
3. WHEN the user taps the RecentReviewsCard header in a Mobile_Viewport, THE RecentReviewsCard SHALL expand to show the list of recent reviews with a maximum height of 40vh.
4. WHILE the App is rendered in a Mobile_Viewport, THE RecentReviewsCard SHALL use font sizes and padding reduced proportionally from the desktop version.
5. WHILE the App is rendered in a Mobile_Viewport, THE RecentReviewsCard SHALL remain positioned in the bottom-right corner without overlapping the Navbar.

### Requirement 6: Mobile MarkerForm

**User Story:** As a mobile user, I want the review form to be easy to fill out on a small screen, so that I can submit reviews without struggling with tiny inputs or keyboard overlap.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE MarkerForm SHALL occupy at most 95% of the viewport width and be vertically centered.
2. WHILE the App is rendered in a Mobile_Viewport, THE MarkerForm SHALL use a minimum font size of 16px for text inputs to prevent iOS auto-zoom on focus.
3. WHILE the App is rendered in a Mobile_Viewport, THE MarkerForm SHALL display the StarRating component with star elements sized at a minimum of 44x44 pixels each for touch accessibility.
4. WHILE the App is rendered in a Mobile_Viewport, THE MarkerForm submit and cancel buttons SHALL have a minimum height of 44px.
5. IF the mobile keyboard overlaps the MarkerForm, THEN THE MarkerForm SHALL remain scrollable so that all fields are accessible.

### Requirement 7: Touch-Friendly Tap Targets

**User Story:** As a mobile user, I want all interactive elements to be large enough to tap accurately, so that I do not accidentally trigger the wrong action.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE App SHALL render all Tap_Targets (buttons, links, interactive markers) with a minimum touch area of 44x44 pixels.
2. WHILE the App is rendered in a Mobile_Viewport, THE App SHALL provide at least 8px spacing between adjacent Tap_Targets to prevent accidental activation of neighboring elements.
3. WHILE the App is rendered in a Mobile_Viewport, THE Navbar navigation links SHALL have padding sufficient to reach the 44px minimum tap height.

### Requirement 8: Mobile Visual Integrity

**User Story:** As a mobile user, I want the interface to render without visual bugs, so that no content is clipped, overflows, or hidden behind other elements.

#### Acceptance Criteria

1. WHILE the App is rendered in a Mobile_Viewport, THE App SHALL not produce horizontal scrolling on the page body.
2. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL fill the remaining viewport height below the Navbar without overflow or clipping.
3. WHILE the App is rendered in a Mobile_Viewport, THE App SHALL maintain correct z-index layering: ContextMenu above MarkerForm above RecentReviewsCard above MapView.
4. WHILE the App is rendered in a Mobile_Viewport, THE Leaflet attribution text SHALL remain visible and not overlap interactive elements.

### Requirement 9: Mobile Viewport Meta and Performance

**User Story:** As a mobile user, I want the page to load efficiently and render at the correct scale, so that the experience feels responsive from the start.

#### Acceptance Criteria

1. THE App SHALL include a viewport meta tag with width=device-width and initial-scale=1.0 in the HTML document head.
2. WHILE the App is rendered in a Mobile_Viewport, THE MapView SHALL load tile data for the visible viewport bounds without requesting excessively large tile areas.
3. WHILE the App is rendered in a Mobile_Viewport, THE App SHALL use CSS media queries or container queries rather than JavaScript-based resize listeners for layout adaptation where possible.
