import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'

function ChecklistsPage() {
  const [user, setUser] = useState(undefined)
  const [items, setItems] = useState([])
  const [shares, setShares] = useState([])
  const [collaborators, setCollaborators] = useState({})

  useEffect(() => {
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user) {
      // Load user's shares to match with checklists
      apiFetch('/shares')
        .then(r => r.json())
        .then(({ shares }) => setShares(Array.isArray(shares) ? shares : []))
        .catch(() => {})
    }
  }, [user])

  const scan = () => {
    const out = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith('bp_checklist_')) continue
        const planId = key.replace('bp_checklist_', '')
        const tasksRaw = localStorage.getItem(key)
        const tasks = JSON.parse(tasksRaw || '[]')
        const modelRaw = localStorage.getItem(`bp_model_${planId}`)
        let model
        try { model = modelRaw ? JSON.parse(modelRaw) : null } catch {}
        out.push({ planId, tasks: Array.isArray(tasks) ? tasks : [], model })
      }
    } catch {}
    out.sort((a, b) => (a.model?.name || '').localeCompare(b.model?.name || ''))
    setItems(out)
  }

  useEffect(() => {
    scan()
    const onFocus = () => scan()
    const onStorage = (e) => { if (e?.key?.startsWith?.('bp_checklist_') || e?.key?.startsWith?.('bp_model_')) scan() }
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const open = (planId) => {
    // load the model copy if exists
    const modelRaw = localStorage.getItem(`bp_model_${planId}`)
    if (modelRaw) {
      try { localStorage.setItem('bp_selected_model', modelRaw) } catch {}
    }
    window.location.assign('/plan')
  }

  const removeChecklist = (planId) => {
    if (!confirm('Delete this checklist permanently?')) return
    try {
      localStorage.removeItem(`bp_checklist_${planId}`)
      localStorage.removeItem(`bp_model_${planId}`)
    } catch {}
    setItems(prev => prev.filter(i => i.planId !== planId))
  }

  const share = async (planId, model, tasks) => {
    try {
      const res = await apiFetch('/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, name: model?.name || planId, model, tasks })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to share')
      alert(`Share created! URL: ${data.url}`)
      // Refresh shares list
      apiFetch('/shares')
        .then(r => r.json())
        .then(({ shares }) => setShares(Array.isArray(shares) ? shares : []))
        .catch(() => {})
    } catch (e) {
      alert(e.message || 'Failed to share')
    }
  }

  const isShared = (planId) => {
    return shares.some(s => s.plan_id === planId)
  }

  const loadCollaborators = async (shareId) => {
    try {
      const res = await apiFetch(`/collaborators/${shareId}`)
      const data = await res.json()
      if (res.ok) {
        setCollaborators(prev => ({ ...prev, [shareId]: data.collaborators }))
      }
    } catch (e) {
      console.error('Failed to load collaborators', e)
    }
  }

  const showCollaborators = (planId) => {
    const share = shares.find(s => s.plan_id === planId)
    if (!share) {
      alert('This checklist is not shared yet. Share it first to see collaborators.')
      return
    }
    if (!collaborators[share.id]) {
      loadCollaborators(share.id)
    }
    const collabs = collaborators[share.id] || []
    if (collabs.length === 0) {
      alert('No collaborators yet.')
    } else {
      const list = collabs.map(c => `• ${c.name} (${c.email}) - ${c.status}`).join('\n')
      alert(`Collaborators:\n${list}`)
    }
  }

  const launchBusiness = (planId, model) => {
    // Store the business model data for the personalized page
    try {
      localStorage.setItem('bp_launched_business', JSON.stringify({ planId, model }))
    } catch (e) {
      console.error('Failed to store business data:', e)
    }
    // Navigate to the personalized business page
    window.location.assign('/business')
  }

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Checking your session…</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Please log in to view checklists</h2>
          <a href="/login" className="primary" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12 }}>Login</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 16, alignContent: 'start' }}>
        <Card title="My Checklists">
          {items.length === 0 ? (
            <div style={{ color: 'var(--muted-foreground)' }}>No checklists found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {items.map(({ planId, tasks, model }) => {
                const total = tasks.length
                const done = tasks.filter(t => t.done).length
                const pct = total ? Math.round((done / total) * 100) : 0
                return (
                  <section key={planId} className="card" style={{ background: 'var(--card)' }}>
                    <h3 style={{ marginBottom: 6 }}>{model?.name || planId}</h3>
                    <p style={{ marginBottom: 10 }}>{model?.description || 'No description'}</p>
                    <div style={{ marginBottom: 10 }}>{done}/{total} completed ({pct}%)</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="primary" style={{ borderRadius: 12 }} onClick={() => open(planId)}>Open</button>
                      {pct === 100 && (
                        <button 
                          className="primary" 
                          style={{ 
                            borderRadius: 12, 
                            background: '#4a7c59', 
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                          onClick={() => launchBusiness(planId, model)}
                        >
                          🚀 Launch Business
                        </button>
                      )}
                      <button className="glass" style={{ borderRadius: 12 }} onClick={() => removeChecklist(planId)}>Delete</button>
                      {isShared(planId) ? (
                        <>
                          <button className="glass" style={{ borderRadius: 12, background: 'var(--muted)', color: 'var(--muted-foreground)' }} disabled>Already Shared</button>
                          <button className="glass" style={{ borderRadius: 12 }} onClick={() => showCollaborators(planId)}>Collaborators</button>
                        </>
                      ) : (
                        <button className="glass" style={{ borderRadius: 12 }} onClick={() => share(planId, model, tasks)}>Share</button>
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ChecklistsPage


