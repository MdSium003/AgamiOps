import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Card from '../components/Card.jsx'

function MarketplacePage() {
  const [shares, setShares] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collaborating, setCollaborating] = useState(new Set())
  const [user, setUser] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    // Load user info and shares in parallel
    Promise.all([
      apiFetch('/auth/me').then(r => r.json()).then(({ user }) => setUser(user || null)).catch(() => {}),
      apiFetch('/shares').then(r => r.json()).then(({ shares }) => setShares(Array.isArray(shares) ? shares : []))
    ])
      .catch(() => setError('Failed to load marketplace'))
      .finally(() => setLoading(false))
  }, [])

  const handleCollaborate = async (shareId) => {
    if (collaborating.has(shareId)) return
    
    setCollaborating(prev => new Set([...prev, shareId]))
    try {
      const response = await apiFetch('/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: shareId, message: 'I would like to collaborate on this project.' })
      })
      
      if (response.ok) {
        alert('Collaboration request sent successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send collaboration request')
      }
    } catch (err) {
      alert('Failed to send collaboration request')
    } finally {
      setCollaborating(prev => {
        const newSet = new Set(prev)
        newSet.delete(shareId)
        return newSet
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <style>{`
        .market-grid { display: grid; gap: 12px; grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 640px) { .market-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1024px) { .market-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
      `}</style>
      <Card title="Marketplace">
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div style={{ color: '#b91c1c' }}>{error}</div>
        ) : (
          <div className="market-grid">
            {shares.map((s) => (
              <section key={s.id} className="card" style={{ background: 'var(--card)' }}>
                <h3 style={{ marginBottom: 6 }}>{s.name || s.plan_id}</h3>
                <p style={{ color: 'var(--muted-foreground)', marginBottom: 10 }}>{s.description || 'No description'}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a className="glass" style={{ borderRadius: 12 }} href={`/share/${s.id}`}>See more</a>
                  {user && s.user_id === user.id ? (
                    <button className="glass" style={{ borderRadius: 12, background: 'var(--muted)', color: 'var(--muted-foreground)' }} disabled>Your Project</button>
                  ) : (
                    <button 
                      className="primary" 
                      style={{ borderRadius: 12, opacity: collaborating.has(s.id) ? 0.6 : 1 }} 
                      onClick={() => handleCollaborate(s.id)}
                      disabled={collaborating.has(s.id)}
                    >
                      {collaborating.has(s.id) ? 'Sending...' : 'Want to collaborate'}
                    </button>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default MarketplacePage


