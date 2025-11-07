import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch } from '../api'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'

function ShareDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [collaborating, setCollaborating] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError('')
    // Load user info and share data in parallel
    Promise.all([
      apiFetch('/auth/me').then(r => r.json()).then(({ user }) => setUser(user || null)).catch(() => {}),
      apiFetch(`/share/${id}`).then(r => r.json()).then(d => setData(d))
    ])
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCollaborate = async () => {
    if (collaborating) return
    
    setCollaborating(true)
    try {
      const response = await apiFetch('/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: id, message: 'I would like to collaborate on this project.' })
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
      setCollaborating(false)
    }
  }

  const model = data?.model || {}
  const tasks = Array.isArray(data?.tasks) ? data.tasks : []

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <Card title={data?.name || 'Shared Plan'}>
          {loading ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <span>Loading…</span>
            </div>
          ) : error ? (
            <div style={{ color: '#b91c1c' }}>{error}</div>
          ) : (
            <div className="card" style={{ background: 'var(--card)' }}>
              <h2 style={{ marginBottom: 6 }}>{model.name || data?.name}</h2>
              <p style={{ marginBottom: 12 }}>{model.description}</p>
              <ul style={{ lineHeight: 1.6, paddingLeft: 18 }}>
                <li><strong>Customer:</strong> {model.targetCustomer}</li>
                <li><strong>Value prop:</strong> {model.valueProp}</li>
                <li><strong>Pricing:</strong> {model.pricing}</li>
                <li><strong>Revenue:</strong> {model.revenueStreams}</li>
                <li><strong>Startup costs:</strong> {model.startupCosts}</li>
                <li><strong>Key activities:</strong> {model.keyActivities}</li>
                <li><strong>Marketing:</strong> {model.marketingPlan}</li>
                <li><strong>Operations:</strong> {model.operations}</li>
                <li><strong>Risks:</strong> {model.risks}</li>
              </ul>
              {user && data?.user_id !== user.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <button 
                    className="primary" 
                    style={{ borderRadius: 12, opacity: collaborating ? 0.6 : 1 }} 
                    onClick={handleCollaborate}
                    disabled={collaborating}
                  >
                    {collaborating ? 'Sending...' : 'Want to collaborate'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {tasks.length > 0 ? (
          <Card title="Execution Checklist">
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {tasks.map((t, idx) => (
                <li key={`${t.id}-${idx}`} className="card" style={{ background: 'var(--card)', padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, textAlign: 'center' }}>{t.done ? '✔️' : '⬜'}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{idx + 1}. {t.title}</div>
                    {t.details ? <div style={{ color: 'var(--muted-foreground)', marginTop: 4 }}>{t.details}</div> : null}
                    <div style={{ color: 'var(--muted-foreground)', marginTop: 6, fontSize: 12 }}>
                      <span className="glass" style={{ padding: '2px 8px', borderRadius: 999 }}>{t.category || 'Task'}</span>
                      <span style={{ marginLeft: 8 }}>Owner: {t.suggestedOwner || '—'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default ShareDetailPage


