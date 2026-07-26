interface NavbarProps {
  stats: { reviews: number; markers: number }
}

export function Navbar({ stats }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-title">Ateneo Food Guide</span>
      </div>
      <div className="navbar-stats">
        <span className="stat-badge">{stats.reviews} Reviews</span>
      </div>
      <ul className="navbar-nav">
        <li><a href="#map">Map</a></li>
      </ul>
    </nav>
  )
}
