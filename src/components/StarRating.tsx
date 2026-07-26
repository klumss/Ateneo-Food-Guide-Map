interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
}

export function StarRating({ value, onChange, readonly }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div
      className="star-rating"
      role="group"
      aria-label={readonly ? `Rating: ${value} out of 5 stars` : 'Star rating selector'}
      style={{ display: 'inline-flex', gap: '2px' }}
    >
      {stars.map((star) => {
        const filled = star <= value
        const interactive = !readonly && onChange

        return (
          <span
            key={star}
            role={interactive ? 'button' : undefined}
            aria-label={interactive ? `Rate ${star} star${star > 1 ? 's' : ''}` : `${star} star${star > 1 ? 's' : ''}`}
            aria-pressed={interactive ? filled : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
            onKeyDown={
              interactive
                ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onChange(star)
                  }
                }
                : undefined
            }
            style={{
              cursor: interactive ? 'pointer' : 'default',
              fontSize: '1.5rem',
              color: filled ? '#f5a623' : '#ccc',
              userSelect: 'none',
            }}
          >
            {filled ? '★' : '☆'}
          </span>
        )
      })}
    </div>
  )
}
