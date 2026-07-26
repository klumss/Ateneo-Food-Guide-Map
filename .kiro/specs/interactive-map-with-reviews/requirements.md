# Requirements Document

## Introduction

This document defines the functional requirements for replacing the static map image in the Ateneo Food Guide with an interactive Leaflet-based map featuring real-time review markers powered by Firestore. Users can create, view, edit, and delete reviews placed directly on the map. Marker ownership is determined by a UUID stored in localStorage, and live stats update in the hero section.

## Glossary

- **Map**: The interactive Leaflet map component centered on Ateneo de Davao Jacinto Campus
- **Marker**: A geographical point on the map representing a food review
- **Review**: The text content, star rating, and optional images associated with a marker
- **Author**: The user who created a marker, identified by their UUID
- **UUID**: A universally unique identifier generated via `crypto.randomUUID()` and stored in localStorage
- **Context_Menu**: A right-click menu shown on own markers offering Edit and Delete options
- **Lightbox**: A full-screen overlay displaying an image at full size
- **Stats**: Live counts displayed in the hero section (Reviews, Map Markers, Contributors)
- **System**: The Ateneo Food Guide web application

## Requirements

### Requirement 1: Interactive Map Display

**User Story:** As a user, I want to see an interactive map centered on the Ateneo de Davao Jacinto Campus, so that I can visually explore food spots in the area.

#### Acceptance Criteria

1. THE System SHALL render an interactive Leaflet map in the map section replacing the static image
2. THE Map SHALL be centered on Ateneo de Davao Jacinto Campus coordinates (7.0731, 125.6122)
3. THE Map SHALL display OpenStreetMap tile layers with zoom and pan controls
4. WHEN the page loads, THE Map SHALL display all existing markers from the Firestore `markers` collection

### Requirement 2: Marker Creation

**User Story:** As a user, I want to double-click on the map to create a review marker with text, star rating, and images, so that I can share my food experience with other students.

#### Acceptance Criteria

1. WHEN a user double-clicks on the Map, THE System SHALL open a MarkerForm popup at the clicked coordinates
2. THE MarkerForm SHALL provide a text input field for review text (max 500 characters)
3. THE MarkerForm SHALL provide an interactive 5-star rating selector
4. THE MarkerForm SHALL provide an image upload input accepting up to 2 image files (JPEG, PNG, WebP)
5. WHEN the user submits a valid MarkerForm, THE System SHALL upload attached images to Firebase Storage and create a new document in the Firestore `markers` collection
6. WHEN the user submits a valid MarkerForm, THE System SHALL set the `authorId` field to the current user's UUID
7. WHEN the user cancels the MarkerForm, THE System SHALL close the form without creating a marker

### Requirement 3: Form Validation

**User Story:** As a user, I want clear validation on the marker form, so that I cannot submit incomplete or invalid reviews.

#### Acceptance Criteria

1. WHEN a user attempts to submit a MarkerForm with empty or whitespace-only text, THE System SHALL prevent submission and display a validation error
2. WHEN a user attempts to submit a MarkerForm without selecting a star rating, THE System SHALL prevent submission and display a validation error
3. WHEN a user attempts to attach more than 2 images, THE System SHALL prevent the additional attachment and display a validation error
4. WHEN a user submits a MarkerForm with valid text (non-empty after trim, ≤ 500 chars), a rating in [1,5], and ≤ 2 images, THE System SHALL accept the submission

### Requirement 4: Real-Time Synchronization

**User Story:** As a user, I want markers to appear on the map immediately when anyone creates one, so that I always see the latest reviews.

#### Acceptance Criteria

1. THE System SHALL subscribe to the Firestore `markers` collection using `onSnapshot` for real-time updates
2. WHEN a new marker is added to Firestore, THE Map SHALL render the new marker without page reload
3. WHEN a marker is updated in Firestore, THE Map SHALL reflect the changes without page reload
4. WHEN a marker is deleted from Firestore, THE Map SHALL remove the marker without page reload

### Requirement 5: Marker Display and Hover Interaction

**User Story:** As a user, I want to hover over markers to see a preview of the review, so that I can quickly browse food spots without clicking each one.

#### Acceptance Criteria

1. WHEN a user hovers over a Marker, THE System SHALL display a tooltip showing the review text snippet, star rating, and thumbnail images
2. WHEN a user clicks a thumbnail image in the tooltip, THE System SHALL open the Lightbox displaying the full-size image
3. WHEN the Lightbox is open, THE System SHALL close it when the user clicks outside the image or clicks a close button

### Requirement 6: Marker Ownership and Color Coding

**User Story:** As a user, I want to visually distinguish my own markers from others' markers, so that I can quickly find my reviews on the map.

#### Acceptance Criteria

1. THE System SHALL generate a UUID on first visit and persist it in localStorage under the key `ateneo-food-guide-user-id`
2. WHEN displaying markers, THE System SHALL render markers where `authorId` equals the current user's UUID in blue color
3. WHEN displaying markers, THE System SHALL render markers where `authorId` does not equal the current user's UUID in red color
4. THE System SHALL use the same UUID across page reloads and browser sessions until localStorage is cleared

### Requirement 7: Edit and Delete Own Markers

**User Story:** As a user, I want to right-click my own markers to edit or delete them, so that I can correct mistakes or remove outdated reviews.

#### Acceptance Criteria

1. WHEN a user right-clicks a Marker they own, THE System SHALL display a Context_Menu with Edit and Delete options
2. WHEN a user right-clicks a Marker they do not own, THE System SHALL not display a Context_Menu
3. WHEN the user selects Edit from the Context_Menu, THE System SHALL open a pre-filled MarkerForm with the existing review data
4. WHEN the user submits an edited MarkerForm, THE System SHALL update the Firestore document preserving `createdAt` and `authorId`
5. WHEN the user selects Delete from the Context_Menu, THE System SHALL remove the marker document from Firestore and delete associated images from Storage

### Requirement 8: Live Stats in Hero Section

**User Story:** As a user, I want to see live statistics about the community's contributions, so that I can understand the platform's activity.

#### Acceptance Criteria

1. THE System SHALL display a Reviews count equal to the total number of documents in the `markers` collection
2. THE System SHALL display a Map Markers count equal to the total number of documents in the `markers` collection
3. THE System SHALL display a Contributors count equal to the number of distinct `authorId` values across all markers
4. WHEN markers are added or removed in Firestore, THE Stats SHALL update in real-time without page reload

### Requirement 9: Error Handling

**User Story:** As a user, I want clear feedback when something goes wrong, so that I know what happened and can retry if needed.

#### Acceptance Criteria

1. IF an image upload to Firebase Storage fails, THEN THE System SHALL display an error message and not save the marker
2. IF a Firestore write operation fails, THEN THE System SHALL display an error notification and preserve the form data for retry
3. IF the real-time listener loses connection, THEN THE System SHALL continue displaying the last known marker state
4. WHEN a form validation error occurs, THE System SHALL display inline error messages next to the invalid fields
