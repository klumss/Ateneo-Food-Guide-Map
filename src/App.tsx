import { useState, useEffect, useMemo, useRef } from 'react'
import './App.css'
import MapView from './components/MapView'
import { Navbar } from './components/Navbar'
import { RecentReviewsCard } from './components/RecentReviewsCard'
import { MarkerForm } from './components/MarkerForm'
import { getUserId } from './utils/userId'
import L from 'leaflet'
import {
  subscribeToMarkers,
  subscribeToStats,
  createMarker,
  updateMarker,
  deleteMarker,
  type MarkerData,
  type MarkerFormData,
  type LatLng,
  type MapStats,
} from './services/markers'

function App() {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [stats, setStats] = useState<MapStats>({ reviews: 0, markers: 0, contributors: 0 })
  const [formPosition, setFormPosition] = useState<LatLng | null>(null)
  const [editingMarker, setEditingMarker] = useState<MarkerData | null>(null)
  const [showForm, setShowForm] = useState(false)

  const userId = useMemo(() => getUserId(), [])
  const mapRef = useRef<L.Map | null>(null)

  // Subscribe to markers
  useEffect(() => {
    const unsubscribe = subscribeToMarkers((updatedMarkers) => {
      setMarkers(updatedMarkers)
    })
    return unsubscribe
  }, [])

  // Subscribe to stats
  useEffect(() => {
    const unsubscribe = subscribeToStats((updatedStats) => {
      setStats(updatedStats)
    })
    return unsubscribe
  }, [])

  // Event handlers
  const handleMapDoubleClick = (latlng: LatLng) => {
    setFormPosition(latlng)
    setShowForm(true)
    setEditingMarker(null)
  }

  const handleFormSubmit = async (data: MarkerFormData) => {
    try {
      if (editingMarker) {
        await updateMarker(editingMarker.id, data, userId)
      } else if (formPosition) {
        await createMarker(data, formPosition, userId)
      }
      setShowForm(false)
      setFormPosition(null)
      setEditingMarker(null)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred while saving the marker.')
      throw error
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setFormPosition(null)
    setEditingMarker(null)
  }

  const handleMarkerEdit = (marker: MarkerData) => {
    setEditingMarker(marker)
    setShowForm(true)
  }

  const handleMarkerDelete = async (markerId: string) => {
    try {
      await deleteMarker(markerId, userId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred while deleting the marker.')
    }
  }

  const handleNavigateToMarker = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 18)
    }
  }

  return (
    <div className="dashboard">
      <Navbar stats={stats} />
      <main className="map-area">
        <MapView
          markers={markers}
          currentUserId={userId}
          onMapDoubleClick={handleMapDoubleClick}
          onMarkerEdit={handleMarkerEdit}
          onMarkerDelete={handleMarkerDelete}
          mapRef={mapRef}
        />
        <RecentReviewsCard markers={markers} onNavigate={handleNavigateToMarker} />
        {showForm && (
          <MarkerForm
            position={formPosition}
            existingMarker={editingMarker}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        )}
      </main>
    </div>
  )
}

export default App
