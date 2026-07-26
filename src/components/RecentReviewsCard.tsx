import { useState } from 'react'
import type { MarkerData } from '../services/markers'
import { getRecentMarkers } from '../utils/recentMarkers'
import { StarRating } from './StarRating'

interface RecentReviewsCardProps {
  markers: MarkerData[]
  onNavigate: (lat: number, lng: number) => void
}

export function RecentReviewsCard({ markers, onNavigate }: RecentReviewsCardProps) {
  const isMobile = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 768px)').matches
    : false
  const [expanded, setExpanded] = useState(!isMobile)

  const recentMarkers = getRecentMarkers(markers)
  const displayedMarkers = expanded ? recentMarkers : []

  return (
    <div
      className={`recent-reviews-card${expanded ? ' expanded' : ''}`}
      aria-label="Recent reviews"
    >
      <button className="recent-reviews-header" onClick={() => setExpanded(!expanded)}>
        <span>Recent Reviews ({recentMarkers.length})</span>
        <span>{expanded ? '▾' : '▸'}</span>
      </button>
      <ul className="recent-reviews-list">
        {displayedMarkers.map((marker) => (
          <li key={marker.id}>
            <button onClick={() => onNavigate(marker.lat, marker.lng)}>
              <span className="recent-review-name">{marker.text.length > 30 ? marker.text.slice(0, 30) + '...' : marker.text}</span>
              <StarRating value={marker.rating} readonly />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
