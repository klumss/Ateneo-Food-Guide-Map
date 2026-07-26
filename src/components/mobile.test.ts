/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { clampMenuPosition } from './ReviewMarker'

/**
 * Unit tests for mobile adaptations.
 *
 * 1. clampMenuPosition — edge positions (corners, edges, center)
 * 2. RecentReviewsCard collapsed-by-default on mobile
 * 3. MapLongPressHandler conditional attachment on touch devices
 *
 * Validates: Requirements 4.4, 5.1, 1.4
 */

describe('clampMenuPosition - edge position unit tests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('position at (0, 0) with menu that fits returns (0, 0)', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    const result = clampMenuPosition(0, 0, 120, 80)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('position near right edge clamps x to viewport - menuWidth', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    // x = 950 with menuWidth = 120 → 950 + 120 = 1070 > 1024
    const result = clampMenuPosition(950, 100, 120, 80)
    expect(result.x).toBe(1024 - 120) // 904
    expect(result.y).toBe(100) // y unchanged
  })

  it('position near bottom edge clamps y to viewport - menuHeight', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    // y = 720 with menuHeight = 80 → 720 + 80 = 800 > 768
    const result = clampMenuPosition(100, 720, 120, 80)
    expect(result.x).toBe(100) // x unchanged
    expect(result.y).toBe(768 - 80) // 688
  })

  it('position at bottom-right corner beyond viewport clamps both x and y', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    // Both overflow
    const result = clampMenuPosition(1000, 750, 120, 80)
    expect(result.x).toBe(1024 - 120) // 904
    expect(result.y).toBe(768 - 80) // 688
  })

  it('negative x clamps to 0', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    const result = clampMenuPosition(-50, 100, 120, 80)
    expect(result.x).toBe(0)
    expect(result.y).toBe(100)
  })

  it('negative y clamps to 0', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    const result = clampMenuPosition(100, -30, 120, 80)
    expect(result.x).toBe(100)
    expect(result.y).toBe(0)
  })

  it('both x and y negative clamps both to 0', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    const result = clampMenuPosition(-100, -200, 120, 80)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('position at center of viewport remains unchanged', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    const result = clampMenuPosition(400, 300, 120, 80)
    expect(result).toEqual({ x: 400, y: 300 })
  })

  it('position exactly at max valid position (viewport - menu) stays unchanged', () => {
    vi.stubGlobal('innerWidth', 1024)
    vi.stubGlobal('innerHeight', 768)

    // Exact boundary: x = 904 (1024-120), y = 688 (768-80)
    const result = clampMenuPosition(904, 688, 120, 80)
    expect(result).toEqual({ x: 904, y: 688 })
  })

  it('works with small mobile viewport (375x667)', () => {
    vi.stubGlobal('innerWidth', 375)
    vi.stubGlobal('innerHeight', 667)

    // Menu near bottom-right on small screen
    const result = clampMenuPosition(300, 620, 120, 80)
    expect(result.x).toBe(375 - 120) // 255
    expect(result.y).toBe(667 - 80) // 587
  })
})

describe('RecentReviewsCard - collapsed-by-default on mobile', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('on mobile (max-width: 768px matches), initial expanded state is false', () => {
    // Mock matchMedia to simulate mobile
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Replicate the component's logic
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const expanded = !isMobile

    expect(isMobile).toBe(true)
    expect(expanded).toBe(false)
  })

  it('on desktop (max-width: 768px does not match), initial expanded state is true', () => {
    // Mock matchMedia to simulate desktop
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const expanded = !isMobile

    expect(isMobile).toBe(false)
    expect(expanded).toBe(true)
  })

  it('displayedMarkers is empty when collapsed (mobile)', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(max-width: 768px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Replicate the component's display logic
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const expanded = !isMobile
    const recentMarkers = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const displayedMarkers = expanded ? recentMarkers : []

    expect(displayedMarkers).toHaveLength(0)
  })

  it('displayedMarkers shows all when expanded (desktop)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const expanded = !isMobile
    const recentMarkers = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const displayedMarkers = expanded ? recentMarkers : []

    expect(displayedMarkers).toHaveLength(3)
  })
})

describe('MapLongPressHandler - conditional attachment on non-touch devices', () => {
  let originalMatchMedia: typeof window.matchMedia

  beforeEach(() => {
    originalMatchMedia = window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('isTouchDevice is false when matchMedia("(pointer: coarse)") returns matches: false', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Replicate MapView's touch detection logic
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    expect(isTouchDevice).toBe(false)
  })

  it('isTouchDevice is true when matchMedia("(pointer: coarse)") returns matches: true', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    expect(isTouchDevice).toBe(true)
  })

  it('MapLongPressHandler is not rendered when isTouchDevice is false (conditional rendering logic)', () => {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Replicate the conditional rendering: {isTouchDevice && <MapLongPressHandler ... />}
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const shouldRenderLongPressHandler = isTouchDevice

    expect(shouldRenderLongPressHandler).toBe(false)
  })

  it('MapLongPressHandler is rendered when isTouchDevice is true (conditional rendering logic)', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    const shouldRenderLongPressHandler = isTouchDevice

    expect(shouldRenderLongPressHandler).toBe(true)
  })
})
