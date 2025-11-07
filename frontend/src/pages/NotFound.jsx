import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ background: '#111' }}>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Page not found</h2>
        <p style={{ color: '#ccc', marginBottom: 12 }}>The page you requested doesn’t exist.</p>
        <Link to="/" className="primary" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12 }}>Go Home</Link>
      </div>
    </div>
  )
}

export default NotFound

