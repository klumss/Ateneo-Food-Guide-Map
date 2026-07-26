import { useState, useEffect, useCallback, useRef } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { StarRating } from './StarRating'
import type { MarkerData } from '../services/markers'

interface ReviewMarkerProps {
  marker: MarkerData
  isOwn: boolean
  onEdit: (marker: MarkerData) => void
  onDelete: (markerId: string) => void
}

const MENU_WIDTH = 120
const MENU_HEIGHT = 80

/**
 * Clamps a context menu position so it stays fully within the viewport.
 */
export function clampMenuPosition(
  x: number,
  y: number,
  menuWidth: number,
  menuHeight: number
): { x: number; y: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: Math.max(0, Math.min(x, vw - menuWidth)),
    y: Math.max(0, Math.min(y, vh - menuHeight)),
  }
}

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

export function ReviewMarker({ marker, isOwn, onEdit, onDelete }: ReviewMarkerProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)

  const icon = createMarkerIcon(isOwn)

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Close context menu on click or touchstart outside
  useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', handleCloseContextMenu)
      document.addEventListener('touchstart', handleCloseContextMenu)
      return () => {
        document.removeEventListener('click', handleCloseContextMenu)
        document.removeEventListener('touchstart', handleCloseContextMenu)
      }
    }
  }, [contextMenu, handleCloseContextMenu])

  // Desktop right-click handler with clamping
  const handleContextMenu = (e: L.LeafletMouseEvent) => {
    if (!isOwn) return
    e.originalEvent.preventDefault()
    const clamped = clampMenuPosition(
      e.originalEvent.clientX,
      e.originalEvent.clientY,
      MENU_WIDTH,
      MENU_HEIGHT
    )
    setContextMenu(clamped)
  }

  // Attach long-press touch handlers to owned marker DOM element
  useEffect(() => {
    const markerInstance = markerRef.current
    if (!markerInstance || !isOwn) return

    const element = markerInstance.getElement()
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY }

      longPressTimerRef.current = setTimeout(() => {
        const pos = touchStartPosRef.current
        if (pos) {
          e.preventDefault()
          const clamped = clampMenuPosition(pos.x, pos.y, MENU_WIDTH, MENU_HEIGHT)
          setContextMenu(clamped)
        }
      }, 500)
    }

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPosRef.current) return
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - touchStartPosRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartPosRef.current.y)
      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current)
          longPressTimerRef.current = null
        }
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd)
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }
    }
  }, [isOwn])

  const handleEdit = () => {
    setContextMenu(null)
    onEdit(marker)
  }

  const handleDelete = () => {
    setContextMenu(null)
    onDelete(marker.id)
  }

  const truncatedText = marker.text.length > 100
    ? marker.text.slice(0, 100) + '…'
    : marker.text

  return (
    <>
      <Marker
        position={[marker.lat, marker.lng]}
        icon={icon}
        zIndexOffset={1000}
        eventHandlers={{
          contextmenu: handleContextMenu,
          add: (e) => {
            markerRef.current = e.target as L.Marker
          },
        }}
      >
        <Tooltip className="review-tooltip">
          <div className="review-tooltip-content">
            <p className="review-tooltip-text">{truncatedText}</p>
            <StarRating value={marker.rating} readonly />
          </div>
        </Tooltip>
      </Marker>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleEdit}
            style={contextMenuButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            style={{ ...contextMenuButtonStyle, color: '#dc2626' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2' }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            Delete
          </button>
        </div>
      )}
    </>
  )
}

const contextMenuButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: '0.875rem',
}
