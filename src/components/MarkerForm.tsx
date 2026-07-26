import { useState, type FormEvent } from 'react'
import { StarRating } from './StarRating'
import { validateMarkerForm, type MarkerData, type MarkerFormData } from '../services/markers'

interface MarkerFormProps {
  position: { lat: number; lng: number } | null
  existingMarker?: MarkerData | null
  onSubmit: (data: MarkerFormData) => Promise<void>
  onCancel: () => void
}

interface FormErrors {
  text?: string
  rating?: string
}

export function MarkerForm({ position, existingMarker, onSubmit, onCancel }: MarkerFormProps) {
  const [text, setText] = useState(existingMarker?.text ?? '')
  const [rating, setRating] = useState(existingMarker?.rating ?? 0)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): FormErrors {
    const newErrors: FormErrors = {}

    if (text.trim().length === 0) {
      newErrors.text = 'Review text is required'
    } else if (text.trim().length > 500) {
      newErrors.text = 'Review text must be 500 characters or less'
    }

    if (rating < 1) {
      newErrors.rating = 'Please select a rating'
    }

    return newErrors
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const validationErrors = validate()
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const formData: MarkerFormData = {
      text: text.trim(),
      rating,
      images: [],
    }

    if (!validateMarkerForm(formData)) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!position && !existingMarker) {
    return null
  }

  return (
    <div className="marker-form-overlay" style={overlayStyle}>
      <form onSubmit={handleSubmit} className="marker-form" style={formStyle}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>
          {existingMarker ? 'Edit Review' : 'Add Review'}
        </h3>

        {/* Text Input */}
        <div style={fieldStyle}>
          <label htmlFor="marker-text" style={labelStyle}>
            Review
          </label>
          <textarea
            id="marker-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Write your review..."
            style={textareaStyle}
            rows={4}
          />
          <div style={charCountStyle}>
            {text.length}/500
          </div>
          {errors.text && <span style={errorStyle}>{errors.text}</span>}
        </div>

        {/* Rating */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Rating</label>
          <StarRating value={rating} onChange={setRating} />
          {errors.rating && <span style={errorStyle}>{errors.rating}</span>}
        </div>

        {/* Buttons */}
        <div style={buttonRowStyle}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={submitButtonStyle}
          >
            {isSubmitting ? 'Submitting...' : existingMarker ? 'Update' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 1000,
}

const formStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '8px',
  padding: '20px',
  width: '320px',
  maxWidth: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
}

const fieldStyle: React.CSSProperties = {
  marginBottom: '12px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#333',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.9rem',
  resize: 'vertical',
  boxSizing: 'border-box',
}

const charCountStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#888',
  textAlign: 'right',
  marginTop: '2px',
}

const errorStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#d32f2f',
  marginTop: '4px',
}

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
}

const submitButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  background: '#1976d2',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  cursor: 'pointer',
}

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  background: '#e0e0e0',
  color: '#333',
  border: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  cursor: 'pointer',
}
