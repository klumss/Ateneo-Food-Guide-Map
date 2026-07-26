import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ReviewMarker } from './ReviewMarker'
import type { MarkerData } from '../services/markers'

interface FoodPOI {
  id: number
  lat: number
  lng: number
  name: string
  type: string
}

interface MapViewProps {
  markers: MarkerData[]
  currentUserId: string
  onMapDoubleClick: (latlng: { lat: number; lng: number }) => void
  onMarkerEdit: (marker: MarkerData) => void
  onMarkerDelete: (markerId: string) => void
  mapRef?: React.RefObject<L.Map | null>
}

function MapRefSetter({ mapRef }: { mapRef: React.RefObject<L.Map | null> }) {
  const map = useMap()
  useEffect(() => {
    if (mapRef) {
      (mapRef as React.MutableRefObject<L.Map | null>).current = map
    }
  }, [map, mapRef])
  return null
}

const ATENEO_CENTER: [number, number] = [7.0731, 125.6122]
const DEFAULT_ZOOM = 17

const schoolIcon = L.divIcon({
  className: 'school-marker',
  html: `<div style="
    font-size: 28px;
    text-align: center;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  ">🏫</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

const foodPoiIcon = L.divIcon({
  className: 'food-poi-marker',
  html: `<div style="
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #f59e0b;
    border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  ">🍴</div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function MapEventHandler({ onDoubleClick }: { onDoubleClick: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    dblclick(e) {
      onDoubleClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

function MapLongPressHandler({
  onLongPress,
}: {
  onLongPress: (latlng: { lat: number; lng: number }) => void
}) {
  const map = useMap()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const container = map.getContainer()

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        // Multi-touch (pinch-to-zoom) — cancel any pending timer
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }

      timerRef.current = setTimeout(() => {
        const rect = container.getBoundingClientRect()
        const point = L.point(
          touch.clientX - rect.left,
          touch.clientY - rect.top
        )
        const latlng = map.containerPointToLatLng(point)
        onLongPress({ lat: latlng.lat, lng: latlng.lng })
      }, 500)
    }

    const handleTouchEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!startPosRef.current) return
      // Cancel on multi-touch (e.g. second finger added for pinch)
      if (e.touches.length !== 1) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
        return
      }
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - startPosRef.current.x)
      const dy = Math.abs(touch.clientY - startPosRef.current.y)
      if (dx > 10 || dy > 10) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchmove', handleTouchMove)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [map, onLongPress])

  return null
}

function FoodPoiLayer() {
  const [pois, setPois] = useState<FoodPOI[]>([])

  useEffect(() => {
    const fetchFoodPois = async () => {
      // Bounding box ~500m around campus center
      const south = ATENEO_CENTER[0] - 0.005
      const north = ATENEO_CENTER[0] + 0.005
      const west = ATENEO_CENTER[1] - 0.005
      const east = ATENEO_CENTER[1] + 0.005

      const query = `
        [out:json][timeout:10];
        (
          node["amenity"="restaurant"](${south},${west},${north},${east});
          node["amenity"="cafe"](${south},${west},${north},${east});
          node["amenity"="fast_food"](${south},${west},${north},${east});
          node["shop"="bakery"](${south},${west},${north},${east});
          node["amenity"="food_court"](${south},${west},${north},${east});
        );
        out body;
      `

      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        if (!response.ok) return

        const data = await response.json()
        const foodPois: FoodPOI[] = data.elements
          .filter((el: any) => el.tags?.name)
          .map((el: any) => ({
            id: el.id,
            lat: el.lat,
            lng: el.lon,
            name: el.tags.name,
            type: el.tags.amenity || el.tags.shop || 'food',
          }))

        setPois(foodPois)
      } catch {
        // Silently fail - POI overlay is non-critical
      }
    }

    fetchFoodPois()
  }, [])

  return (
    <>
      {pois.map((poi) => (
        <Marker key={`food-poi-${poi.id}`} position={[poi.lat, poi.lng]} icon={foodPoiIcon} zIndexOffset={-1000}>
          <Tooltip direction="top" offset={[0, -5]} className="review-tooltip">
            <span style={{ fontSize: '12px' }}>{poi.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

export default function MapView({
  markers,
  currentUserId,
  onMapDoubleClick,
  onMarkerEdit,
  onMarkerDelete,
  mapRef,
}: MapViewProps) {
  const [isTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )

  return (
    <MapContainer
      center={ATENEO_CENTER}
      zoom={DEFAULT_ZOOM}
      doubleClickZoom={false}
      style={{ width: '100%', height: '100%' }}
    >
      {mapRef && <MapRefSetter mapRef={mapRef} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        className="dark-tiles"
      />
      <Marker position={ATENEO_CENTER} icon={schoolIcon}>
        <Tooltip permanent direction="top" offset={[0, -10]}>Ateneo de Davao - Jacinto Campus</Tooltip>
      </Marker>
      <FoodPoiLayer />
      <MapEventHandler onDoubleClick={onMapDoubleClick} />
      {isTouchDevice && <MapLongPressHandler onLongPress={onMapDoubleClick} />}
      {markers.map((marker) => (
        <ReviewMarker
          key={marker.id}
          marker={marker}
          isOwn={marker.authorId === currentUserId}
          onEdit={onMarkerEdit}
          onDelete={onMarkerDelete}
        />
      ))}
    </MapContainer>
  )
}
