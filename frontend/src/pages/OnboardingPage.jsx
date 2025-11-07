import { useEffect, useState } from 'react'
import { apiFetch } from '../api'

function OnboardingPage() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => {
        if (user?.name) setName(user.name)
      })
      .catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    try {
      const res = await apiFetch('/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, role, password })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      window.location.assign('/')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ width: 'min(520px, 92vw)' }}>
        <h2 style={{ marginBottom: 12 }}>Complete your profile</h2>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit} autoComplete="off">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" name="onb-name"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Company</label>
            <input value={company} onChange={e=>setCompany(e.target.value)} autoComplete="off" name="onb-company"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Role</label>
            <input value={role} onChange={e=>setRole(e.target.value)} autoComplete="off" name="onb-role"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Create a password (required)</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" required autoComplete="new-password" name="onb-password"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required autoComplete="new-password" name="onb-password-confirm"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
        </div>
          <button type="submit" className="primary" style={{ width: '100%', borderRadius: 12 }}>Save and continue</button>
        </form>
      </div>
    </div>
  )
}

export default OnboardingPage
