import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

function Header({ onLogin, onContact }) {
  const [user, setUser] = useState(null)
  // Remove dark mode support

  useEffect(() => {
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => {})
  }, [])

  // Apply dark/light mode to document root
  // No-op: dark mode removed

  // Fixed theme: keep dull green accents; remove dynamic logo-based color

  const logout = async () => {
    // Clear localStorage to prevent cross-account data sharing
    try {
      localStorage.removeItem('bp_models');
    } catch {}
    
    await apiFetch('/auth/logout', { method: 'POST' })
    window.location.assign('/')
  }

  return (
    <header className="header glass">
      <div className="bar">
        <Link to="/" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', height: 64 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 'clamp(44px, 6vw, 64px)', width: 'auto', objectFit: 'contain', display: 'block' }} />
        </Link>
        <div className="actions">
          {/* Dark mode toggle removed */}
          {user ? (
            <>
              <Link to="/about-us" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>About Us</Link>
              <Link to="/checklists" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>My Checklists</Link>
              <Link to="/marketplace" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>Marketplace</Link>
              <Link to="/profile" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>My Profile</Link>
              <button className="primary" style={{ borderRadius: 12 }} onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/marketplace" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>Marketplace</Link>
              <Link to="/about-us" className="glass" style={{ borderRadius: 12, display: 'inline-block', padding: '10px 16px' }}>About Us</Link>
              <Link to="/login" className="primary">Login</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
