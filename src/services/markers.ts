import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface MarkerData {
  id: string
  lat: number
  lng: number
  text: string
  rating: number
  images: string[]
  authorId: string
  createdAt: Timestamp
}

export interface MarkerFormData {
  text: string
  rating: number
  images: File[]
}

export interface LatLng {
  lat: number
  lng: number
}

export interface MapStats {
  reviews: number
  markers: number
  contributors: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const MARKERS_COLLECTION = 'markers'

// ─── Real-time Subscriptions ───────────────────────────────────────────────────

/**
 * Subscribe to all markers in real-time via Firestore onSnapshot.
 * Callback is invoked immediately with current data and on every subsequent change.
 */
export function subscribeToMarkers(
  callback: (markers: MarkerData[]) => void
): Unsubscribe {
  const markersRef = collection(db, MARKERS_COLLECTION)

  return onSnapshot(markersRef, (snapshot) => {
    const markers: MarkerData[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as MarkerData[]
    callback(markers)
  })
}

/**
 * Subscribe to live stats computed from the markers collection.
 * Stats include total reviews, total markers, and distinct contributors.
 */
export function subscribeToStats(
  callback: (stats: MapStats) => void
): Unsubscribe {
  const markersRef = collection(db, MARKERS_COLLECTION)

  return onSnapshot(markersRef, (snapshot) => {
    const totalMarkers = snapshot.docs.length
    const authorIds = new Set<string>()

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.authorId) {
        authorIds.add(data.authorId)
      }
    })

    callback({
      reviews: totalMarkers,
      markers: totalMarkers,
      contributors: authorIds.size,
    })
  })
}

// ─── CRUD Operations ───────────────────────────────────────────────────────────

/**
 * Create a new marker. Returns the new document ID.
 */
export async function createMarker(
  data: MarkerFormData,
  position: LatLng,
  authorId: string
): Promise<string> {
  const docRef = await addDoc(collection(db, MARKERS_COLLECTION), {
    lat: position.lat,
    lng: position.lng,
    text: data.text.trim(),
    rating: data.rating,
    images: [],
    authorId,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}

/**
 * Update an existing marker. Preserves createdAt and authorId.
 */
export async function updateMarker(
  markerId: string,
  data: MarkerFormData,
  authorId: string
): Promise<void> {
  const markerRef = doc(db, MARKERS_COLLECTION, markerId)
  const markerSnap = await getDoc(markerRef)

  if (!markerSnap.exists()) {
    throw new Error(`Marker ${markerId} not found`)
  }

  const existingData = markerSnap.data()

  // Verify ownership
  if (existingData.authorId !== authorId) {
    throw new Error('Unauthorized: you can only edit your own markers')
  }

  // Update the document, preserving createdAt and authorId
  await updateDoc(markerRef, {
    text: data.text.trim(),
    rating: data.rating,
    images: [],
  })
}

/**
 * Delete a marker.
 */
export async function deleteMarker(
  markerId: string,
  authorId: string
): Promise<void> {
  const markerRef = doc(db, MARKERS_COLLECTION, markerId)
  const markerSnap = await getDoc(markerRef)

  if (!markerSnap.exists()) {
    throw new Error(`Marker ${markerId} not found`)
  }

  const existingData = markerSnap.data()

  // Verify ownership
  if (existingData.authorId !== authorId) {
    throw new Error('Unauthorized: you can only delete your own markers')
  }

  // Delete the Firestore document
  await deleteDoc(markerRef)
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate marker form data.
 * Returns true if:
 * - text is non-empty after trim AND ≤ 500 characters
 * - rating is an integer in [1, 5]
 * - images length ≤ 2
 */
export function validateMarkerForm(data: MarkerFormData): boolean {
  const trimmedText = data.text.trim()

  if (trimmedText.length === 0 || trimmedText.length > 500) {
    return false
  }

  if (
    !Number.isInteger(data.rating) ||
    data.rating < 1 ||
    data.rating > 5
  ) {
    return false
  }

  if (data.images.length > 2) {
    return false
  }

  return true
}
