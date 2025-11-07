import { useState } from 'react'
import { apiFetch, oauthUrl } from '../api'

function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    // Registration no longer sets password here; handled on onboarding
    if (mode === 'register') {
      if (!email) { setError('Email required'); return }
    }
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (data.needsVerification) {
            setError(data.error + ' Click "Resend Verification" below to get a new email.')
            setCanResend(true)
            return
          }
          throw new Error(data.error || 'Login failed')
        }
        if (data.profileCompleted) {
          window.location.assign('/')
        } else {
          window.location.assign('/onboarding')
        }
      } else {
        // register (email only)
        const reg = await apiFetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        const regData = await reg.json().catch(() => ({}))
        if (!reg.ok) throw new Error(regData.error || 'Registration failed')
        
        // Show success message and ask user to verify email
        setError('')
        alert(regData.message || 'Registration successful! Please check your email to verify your account before logging in.')
        setMode('login')
        setCanResend(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const oauth = (provider) => {
    window.location.assign(oauthUrl(provider))
  }

  const resendVerification = async () => {
    if (!email) {
      alert('Please enter your email address first')
      return
    }
    
    try {
      const response = await apiFetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
      } else {
        alert(data.error || 'Failed to resend verification email')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card" style={{ width: 'min(480px, 92vw)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <a href="/" className="glass" style={{ borderRadius: 12, padding: '8px 12px', textDecoration: 'none' }}>← Back to Home</a>
          <span />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className={mode === 'login' ? 'primary' : 'glass'} style={{ borderRadius: 12, flex: 1 }} onClick={() => { setMode('login'); setCanResend(false); setError('') }}>Login</button>
          <button className={mode === 'register' ? 'primary' : 'glass'} style={{ borderRadius: 12, flex: 1 }} onClick={() => { setMode('register'); setCanResend(false); setError('') }}>Register</button>
        </div>
        <h2 style={{ marginBottom: 12 }}>{mode === 'login' ? 'Login' : 'Create account'}</h2>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={submit} autoComplete="off">
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e=>{ setEmail(e.target.value); setCanResend(false); }} required autoComplete="email" name="login-email"
                   style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
          </div>
          {mode === 'login' ? (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: 'var(--muted-foreground)', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" name="login-password"
                     style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid var(--border)' }} />
            </div>
          ) : null}
          <button type="submit" className="primary" style={{ width: '100%', borderRadius: 12 }} disabled={loading}>
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating…') : (mode === 'login' ? 'Sign in' : 'Create account')}
          </button>
        </form>
        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
          <button className="glass" style={{ borderRadius: 12 }} onClick={()=>oauth('google')}>Continue with Google</button>
          <button className="glass" style={{ borderRadius: 12 }} onClick={()=>oauth('linkedin')}>Continue with LinkedIn</button>
        </div>
        {mode === 'login' && canResend && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button 
              className="glass" 
              style={{ borderRadius: 12, fontSize: '14px', padding: '8px 16px' }} 
              onClick={resendVerification}
            >
              Resend Verification Email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginPage

