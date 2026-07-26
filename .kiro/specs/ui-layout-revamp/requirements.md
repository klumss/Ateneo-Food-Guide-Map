# Requirements Document

## Introduction

A comprehensive UI layout revamp for the Ateneo Food Guide application that transforms the current scrollable page into a full-viewport, map-centric dashboard. The redesign removes the hero section, relocates stats to the navbar, introduces a campus boundary overlay, declutters map markers, adds a floating Recent Reviews card, improves tooltip/popup contrast and typography, and applies overall visual polish.

## Glossary

- **Dashboard**: The full-viewport, single-screen layout consisting of Navbar and Map_Area with no vertical page scrolling
- **Navbar**: The top navigation bar containing branding, navigation links, and inline stat badges
- **Map_Area**: The viewport region below the Navbar that displays the interactive Leaflet map, filling all remaining vertical and horizontal space
- **Campus_Overlay**: A semi-transparent polygon drawn on the map representing the Ateneo de Davao Jacinto Campus boundary, with an identifying label
- **Food_Marker**: A map marker that displays a food icon and the restaurant or shop name only
- **Recent_Reviews_Card**: A floating, expandable card positioned in a corner of the map displaying the most recently created markers
- **Review_Tooltip**: The popup/tooltip UI that appears when a user hovers over or clicks a Food_Marker, showing review details
- **Stat_Badge**: A compact inline element in the Navbar showing a live count (Reviews or Map Markers)
- **System**: The Ateneo Food Guide web application (React 19 + TypeScript + Vite + react-leaflet)

## Requirements

### Requirement 1: Full-Viewport Dashboard Layout

**User Story:** As a user, I want the app to be a full-viewport dashboard with the map always visible, so that I can access map content immediately without scrolling.

#### Acceptance Criteria

1. THE Dashboard SHALL occupy exactly 100% of the viewport height and 100% of the viewport width with no vertical page scrolling.
2. THE Navbar SHALL be rendered as a fixed-height element at the top of the viewport.
3. THE Map_Area SHALL fill all remaining viewport space below the Navbar both vertically and horizontally.
4. WHEN the browser window is resized, THE Map_Area SHALL adjust its dimensions to continue filling the available viewport space below the Navbar.

### Requirement 2: Hero Section Removal and Stat Relocation

**User Story:** As a user, I want quick access to community stats in the navbar without a hero section taking up screen space, so that the map is immediately visible on load.

#### Acceptance Criteria

1. THE System SHALL NOT render the hero section, including the badge, title, subtitle, and stats row previously displayed above the map.
2. THE Navbar SHALL display a Stat_Badge showing the live Reviews count.
3. THE Navbar SHALL display a Stat_Badge showing the live Map Markers count.
4. THE Navbar SHALL NOT display a Contributors count.
5. WHEN the markers collection changes, THE Stat_Badge elements SHALL update their displayed counts in real time.

### Requirement 3: Campus Boundary Overlay

**User Story:** As a user, I want to see the Ateneo de Davao Jacinto Campus boundary on the map, so that I can understand which food spots are near campus.

#### Acceptance Criteria

1. THE Map_Area SHALL render a Campus_Overlay as a semi-transparent polygon representing the Ateneo de Davao Jacinto Campus boundary.
2. THE Campus_Overlay SHALL display a text label identifying the area as the Jacinto Campus.
3. THE Campus_Overlay polygon fill SHALL have an opacity value between 0.1 and 0.3 so that underlying map details remain visible.
4. THE Campus_Overlay polygon border SHALL be visually distinct from the fill to clearly define the boundary edges.

### Requirement 4: Decluttered Map Markers

**User Story:** As a user, I want clean and minimal map markers showing only a food icon and name, so that the map is easy to scan without visual clutter.

#### Acceptance Criteria

1. THE Food_Marker SHALL display a food-related icon as its primary visual element.
2. THE Food_Marker SHALL display the restaurant or shop name as a label adjacent to the icon.
3. THE Food_Marker SHALL NOT display rating, review text, images, or other metadata directly on the map surface.
4. WHEN multiple Food_Markers are in close proximity, THE Map_Area SHALL keep each marker legible by using a compact marker size.

### Requirement 5: Recent Reviews Floating Card

**User Story:** As a user, I want to see the most recent reviews in a floating card on the map, so that I can quickly discover new food spots and navigate to them.

#### Acceptance Criteria

1. THE Recent_Reviews_Card SHALL be rendered as a floating element positioned in a corner of the Map_Area with a fixed width.
2. THE Recent_Reviews_Card SHALL display between 3 and 5 of the most recently created markers, ordered by creation time descending.
3. WHEN a user clicks an entry in the Recent_Reviews_Card, THE Map_Area SHALL pan and center on the corresponding Food_Marker location.
4. THE Recent_Reviews_Card SHALL be expandable to reveal additional entries and collapsible to a compact summary state.
5. WHILE the Recent_Reviews_Card is in its collapsed state, THE Recent_Reviews_Card SHALL display a header with the entry count and the first 3 entries.
6. THE Recent_Reviews_Card SHALL have a z-index above the map tiles and below modal overlays so that map interactions remain accessible around the card.

### Requirement 6: Improved Review Tooltip Design

**User Story:** As a user, I want review tooltips with good contrast and readable typography, so that I can comfortably read reviews when hovering over markers.

#### Acceptance Criteria

1. THE Review_Tooltip SHALL have a text-to-background contrast ratio of at least 4.5:1 (WCAG AA compliance for normal text).
2. THE Review_Tooltip body text SHALL use a minimum font size of 14px.
3. THE Review_Tooltip SHALL display the review text, star rating, and thumbnail images in a structured layout with consistent spacing.
4. THE Review_Tooltip border radius, padding, and shadow SHALL visually distinguish the tooltip from the map background.
5. WHEN a Food_Marker has associated images, THE Review_Tooltip SHALL render clickable thumbnail previews of those images.

### Requirement 7: Visual Styling and Polish

**User Story:** As a user, I want a visually appealing interface with modern design elements, so that using the application feels polished and professional.

#### Acceptance Criteria

1. THE Navbar SHALL use a backdrop blur effect and a subtle bottom border to visually separate the navigation from the Map_Area.
2. THE Stat_Badge elements SHALL use a distinct background, rounded shape, and concise typography to differentiate them from navigation links.
3. THE Recent_Reviews_Card SHALL use a card design with rounded corners, a subtle shadow, and a semi-transparent background that complements the dark theme.
4. THE Food_Marker icon SHALL use a consistent color scheme that is visible against both light and dark map tile regions.
5. THE System SHALL maintain the existing dark color theme (--bg-primary: #0d1117) as the base palette while applying visual enhancements.
6. WHEN the viewport width is 768px or less, THE Navbar SHALL reflow its layout to remain usable on smaller screens without horizontal overflow.
