import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card.jsx'
import { apiFetch } from '../api'
import Spinner from '../components/Spinner.jsx'
import { CheckCircle2, Circle } from 'lucide-react'

function SelectedPlan() {
  const [model, setModel] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const storageKey = useMemo(() => {
    const planId = model?.id || model?.name || 'plan'
    return `bp_checklist_${planId}`
  }, [model])

  const planId = useMemo(() => (model?.id || model?.name || 'plan'), [model])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bp_selected_model')
      if (raw) setModel(JSON.parse(raw))
    } catch {}
  }, [])

  async function fetchChecklist() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/ai/plan-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to generate checklist')
      const list = Array.isArray(data.tasks) ? data.tasks : []
      setTasks(list)
      try { localStorage.setItem(storageKey, JSON.stringify(list)) } catch {}
    } catch (e) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!model) return
    // load saved
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) { setTasks(parsed); return }
      }
    } catch {}
    // else fetch from AI
    fetchChecklist()
  }, [model, storageKey])

  const toggleTask = (id) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      // Also persist to server if logged in
      const planId = (model?.id || model?.name || 'plan')
      try {
        apiFetch(`/plans/${encodeURIComponent(planId)}/tasks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tasks: next })
        })
      } catch {}
      return next
    })
  }

  const isLaunched = () => {
    try {
      const raw = localStorage.getItem('bp_launched_business')
      if (!raw) return false
      const saved = JSON.parse(raw)
      const id = model?.id || model?.name || 'plan'
      return saved?.planId === id
    } catch { return false }
  }

  const launchBusiness = () => {
    try {
      localStorage.setItem('bp_launched_business', JSON.stringify({ planId: planId, model }))
    } catch {}
    window.location.assign('/business')
  }

  if (!model) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>No plan selected</h2>
          <a href="/" className="primary" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 12 }}>Go back</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <Card title="Selected Plan">
          <div className="card" style={{ background: 'var(--card)' }}>
            <h2 style={{ marginBottom: 6 }}>{model.name}</h2>
            <p style={{ marginBottom: 12 }}>{model.description}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <button className="glass" style={{ borderRadius: 12 }} onClick={() => {
                if (!confirm('Delete this checklist permanently?')) return
                try {
                  localStorage.removeItem(storageKey)
                  localStorage.removeItem(`bp_model_${planId}`)
                } catch {}
                setTasks([])
              }}>Delete Checklist</button>
            </div>
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
          </div>
        </Card>

        <Card title="Execution Checklist">
          {error && (
            <div style={{ color: '#b91c1c', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span>{error}</span>
              <button className="glass" style={{ borderRadius: 12 }} onClick={fetchChecklist} disabled={loading}>Retry</button>
            </div>
          )}
          {loading ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Spinner />
              <span>Generating checklist…</span>
            </div>
          ) : (
            <div>
              {tasks.length === 0 ? (
                <div style={{ color: 'var(--muted-foreground)' }}>No tasks yet.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                  {tasks.map((t, idx) => {
                    const allPrevDone = tasks.slice(0, idx).every(x => x.done)
                    const canInteract = allPrevDone || t.done
                    return (
                      <li key={t.id} className="card" style={{ background: 'var(--card)', padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start', opacity: canInteract ? 1 : 0.6 }}>
                        <button
                          onClick={() => toggleTask(t.id)}
                          disabled={!canInteract}
                          aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                          title={t.done ? 'Completed' : (canInteract ? 'Mark complete' : 'Complete previous steps first')}
                          className="glass"
                          style={{ borderRadius: 999, width: 42, height: 42, display: 'grid', placeItems: 'center', padding: 0 }}
                        >
                          {t.done ? (
                            <CheckCircle2 size={24} color="#2f6b3a" />
                          ) : (
                            <Circle size={24} color="var(--muted-foreground)" />
                          )}
                        </button>
                        <div>
                          <div style={{ fontWeight: 600 }}>{idx + 1}. {t.title}</div>
                          {t.details ? <div style={{ color: 'var(--muted-foreground)', marginTop: 4 }}>{t.details}</div> : null}
                          <div style={{ color: 'var(--muted-foreground)', marginTop: 6, fontSize: 12 }}>
                            <span className="glass" style={{ padding: '2px 8px', borderRadius: 999 }}>{t.category || 'Task'}</span>
                            <span style={{ marginLeft: 8 }}>Owner: {t.suggestedOwner || '—'}</span>
                            {!canInteract && <span style={{ marginLeft: 8 }}>Complete previous steps to unlock</span>}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {tasks.length > 0 && tasks.every(t => t.done) ? (
                <div>
                  <div className="card" style={{ background: '#e6f7ee', color: '#14532d', padding: 12, marginTop: 12, borderRadius: 12, textAlign: 'center' }}>
                    🎉 Congratulations! All tasks completed. You're ready to launch.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    {isLaunched() ? (
                      <button className="primary" style={{ borderRadius: 12 }} onClick={() => window.location.assign('/business')}>
                        View Business
                      </button>
                    ) : (
                      <button className="primary" style={{ borderRadius: 12 }} onClick={launchBusiness}>
                        🚀 Launch Business
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default SelectedPlan


