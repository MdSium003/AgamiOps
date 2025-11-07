import { useEffect, useState } from 'react'
import { apiFetch } from '../api'
import Spinner from '../components/Spinner.jsx'
import Card from '../components/Card.jsx'

function ProfilePage() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => {})
  }, [])

  const logout = async () => {
    // Clear localStorage to prevent cross-account data sharing
    try {
      localStorage.removeItem('bp_models');
    } catch {}
    
    await apiFetch('/auth/logout', { method: 'POST' })
    window.location.assign('/')
  }

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Loading profile…</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Not signed in</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ display: 'grid', gap: 24, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Information */}
        <Card title="My Profile">
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div className="card" style={{ background: 'var(--card)', padding: 16 }}>
                <h3 style={{ marginBottom: 12, color: 'var(--foreground)' }}>Personal Information</h3>
                <div style={{ lineHeight: 1.8 }}>
                  <div><strong>Name:</strong> {user.name || 'Not provided'}</div>
                  <div><strong>Email:</strong> {user.email || 'Not provided'}</div>
                </div>
              </div>
              <div className="card" style={{ background: 'var(--card)', padding: 16 }}>
                <h3 style={{ marginBottom: 12, color: 'var(--foreground)' }}>Professional Information</h3>
                <div style={{ lineHeight: 1.8 }}>
                  <div><strong>Company:</strong> {user.company || 'Not provided'}</div>
                  <div><strong>Role:</strong> {user.role || 'Not provided'}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="primary" style={{ borderRadius: 12, padding: '12px 24px' }} onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        </Card>

        {/* Pricing Plans */}
        <Card title="Choose Your Plan">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Free Plan */}
            <div className="card" style={{ background: 'var(--card)', padding: 24, border: '2px solid var(--border)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8, color: 'var(--foreground)' }}>Free</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>$0</div>
                <div style={{ color: 'var(--muted-foreground)' }}>per month</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.6 }}>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Basic 2 models per idea</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>3-month forecasts</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Limited chat (50 messages/month)</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Core features only</span>
                </li>
              </ul>
              <button className="glass" style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12 }} disabled>
                Current Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="card" style={{ background: 'var(--card)', padding: 24, border: '2px solid var(--primary)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: '0.875rem', fontWeight: 'bold' }}>
                POPULAR
              </div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8, color: 'var(--foreground)' }}>Pro</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>$9.99</div>
                <div style={{ color: 'var(--muted-foreground)' }}>per month</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.6 }}>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Unlimited models with variants</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>24-month advanced forecasts (ML-enhanced)</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Supplier marketplaces</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Automated templates (emails, contracts)</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Integrations and custom alerts</span>
                </li>
              </ul>
              <button className="primary" style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12 }}>
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="card" style={{ background: 'var(--card)', padding: 24, border: '2px solid var(--border)' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <h3 style={{ marginBottom: 8, color: 'var(--foreground)' }}>Enterprise</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>$49.99</div>
                <div style={{ color: 'var(--muted-foreground)' }}>per month</div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.6 }}>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Team accounts</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>White-label branding</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>API access for custom integrations</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>Dedicated AI fine-tuning</span>
                </li>
                <li style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ color: 'var(--primary)', marginTop: 2 }}>✓</span>
                  <span>SLAs and analytics exports for investors</span>
                </li>
              </ul>
              <button className="glass" style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12 }}>
                Contact Sales
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
