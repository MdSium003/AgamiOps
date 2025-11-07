import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'

function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setError('No verification token provided')
      return
    }

    verifyEmail(token)
  }, [searchParams])

  const verifyEmail = async (token) => {
    try {
      const response = await apiFetch(`/auth/verify-email?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        // Add a small delay to show success state properly
        await new Promise(resolve => setTimeout(resolve, 500))
        setStatus('success')
        setMessage(data.message)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setStatus('error')
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    const email = prompt('Please enter your email address:')
    if (!email) return

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
      <Card style={{ 
        maxWidth: '500px', 
        width: '100%', 
        textAlign: 'center',
        transition: 'all 0.3s ease-in-out'
      }}>
        {status === 'verifying' && (
          <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Spinner />
              <span>Verifying your email address...</span>
            </div>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '14px', textAlign: 'center' }}>
              Please wait while we confirm your account
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
            <div style={{ fontSize: '64px', marginBottom: 20, animation: 'bounce 0.6s ease-in-out' }}>🎉</div>
            <h2 style={{ marginBottom: 16, color: 'var(--primary)', fontSize: '28px' }}>Email Verified Successfully!</h2>
            <p style={{ marginBottom: 24, color: 'var(--muted-foreground)', fontSize: '16px' }}>{message}</p>
            <div style={{ 
              background: 'var(--muted)', 
              padding: '12px 20px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              display: 'inline-block'
            }}>
              <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', margin: 0 }}>
                Redirecting to login page in 3 seconds...
              </p>
            </div>
            <button 
              className="primary" 
              style={{ 
                marginTop: 16, 
                borderRadius: 12, 
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600'
              }}
              onClick={() => navigate('/login')}
            >
              Go to Login Now
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>❌</div>
            <h2 style={{ marginBottom: 16, color: '#dc2626' }}>Verification Failed</h2>
            <p style={{ marginBottom: 24, color: 'var(--muted-foreground)' }}>{error}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="primary" 
                style={{ borderRadius: 12 }}
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </button>
              <button 
                className="glass" 
                style={{ borderRadius: 12 }}
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
      </Card>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

export default VerifyEmailPage
