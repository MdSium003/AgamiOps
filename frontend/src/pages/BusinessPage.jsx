import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'
import { apiFetch } from '../api'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Calendar,
  CheckCircle2,
  BarChart3,
  Lightbulb,
  Building2,
  MapPin
} from 'lucide-react'

function BusinessPage() {
  const [businessData, setBusinessData] = useState(null)
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    // Load business data from localStorage
    try {
      const stored = localStorage.getItem('bp_launched_business')
      if (stored) {
        const data = JSON.parse(stored)
        setBusinessData(data)
      } else {
        setError('No business data found. Please complete a checklist first.')
      }
    } catch (e) {
      setError('Failed to load business data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Loading your business dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8, color: 'var(--destructive)' }}>Error</h2>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button className="primary" style={{ borderRadius: 12 }} onClick={() => navigate('/checklists')}>
            Go to Checklists
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Please log in to view your business</h2>
          <button className="primary" style={{ borderRadius: 12 }} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    )
  }

  const { model } = businessData

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#faf8f5' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gap: 24 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <Building2 size={48} color="#4a7c59" />
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#111', margin: 0 }}>
              {model?.name || 'Your Business'}
            </h1>
          </div>
          <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            {model?.description || 'Your personalized business dashboard is ready!'}
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: '#4a7c59', 
            color: 'white', 
            padding: '8px 16px', 
            borderRadius: 20, 
            marginTop: 16,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <CheckCircle2 size={16} />
            Business Plan Complete
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                background: '#4a7c59', 
                borderRadius: 12, 
                padding: 12, 
                display: 'grid', 
                placeItems: 'center' 
              }}>
                <DollarSign size={24} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#111' }}>Revenue Potential</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4a7c59' }}>
                  {model?.projections?.base?.revenue?.[11] ? 
                    formatCurrency(model.projections.base.revenue[11]) : 
                    'TBD'
                  }
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Year 1 Projection</p>
              </div>
            </div>
          </Card>

          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                background: '#4a7c59', 
                borderRadius: 12, 
                padding: 12, 
                display: 'grid', 
                placeItems: 'center' 
              }}>
                <Users size={24} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#111' }}>Target Customers</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4a7c59' }}>
                  {model?.projections?.base?.customers?.[11] ? 
                    formatNumber(model.projections.base.customers[11]) : 
                    'TBD'
                  }
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Year 1 Target</p>
              </div>
            </div>
          </Card>

          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                background: '#4a7c59', 
                borderRadius: 12, 
                padding: 12, 
                display: 'grid', 
                placeItems: 'center' 
              }}>
                <TrendingUp size={24} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#111' }}>Growth Rate</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4a7c59' }}>
                  {model?.growthRate ? `${model.growthRate}%` : 'TBD'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Monthly Growth</p>
              </div>
            </div>
          </Card>

          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                background: '#4a7c59', 
                borderRadius: 12, 
                padding: 12, 
                display: 'grid', 
                placeItems: 'center' 
              }}>
                <Target size={24} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#111' }}>Market Size</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#4a7c59' }}>
                  {model?.marketSize ? formatCurrency(model.marketSize) : 'TBD'}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Total Addressable</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Business Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
          
          {/* Business Model */}
          <Card title="Business Model" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Lightbulb size={20} color="#4a7c59" />
                <div>
                  <strong>Value Proposition:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {model?.valueProposition || 'Your unique value proposition will be defined here.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={20} color="#4a7c59" />
                <div>
                  <strong>Target Market:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {model?.targetMarket || 'Your target market will be defined here.'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <DollarSign size={20} color="#4a7c59" />
                <div>
                  <strong>Revenue Model:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    {model?.revenueModel || 'Your revenue model will be defined here.'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Next Steps */}
          <Card title="Next Steps" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ 
                padding: 12, 
                background: '#f0f9f0', 
                borderRadius: 8, 
                border: '1px solid #4a7c59',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <CheckCircle2 size={16} color="#4a7c59" />
                <span style={{ color: '#4a7c59', fontWeight: 'bold' }}>Business Plan Complete</span>
              </div>
              <div style={{ padding: 12, background: '#f5f1eb', borderRadius: 8 }}>
                <strong>1. Secure Funding</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Present your plan to investors or apply for business loans
                </p>
              </div>
              <div style={{ padding: 12, background: '#f5f1eb', borderRadius: 8 }}>
                <strong>2. Build Your Team</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Hire key personnel and establish your organizational structure
                </p>
              </div>
              <div style={{ padding: 12, background: '#f5f1eb', borderRadius: 8 }}>
                <strong>3. Launch MVP</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Develop and launch your minimum viable product
                </p>
              </div>
              <div style={{ padding: 12, background: '#f5f1eb', borderRadius: 8 }}>
                <strong>4. Market & Scale</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Execute your marketing strategy and scale operations
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            className="primary" 
            style={{ 
              borderRadius: 12, 
              padding: '12px 24px',
              background: '#4a7c59',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => navigate('/checklists')}
          >
            <BarChart3 size={16} />
            View Checklists
          </button>
          <button 
            className="primary" 
            style={{ 
              borderRadius: 12, 
              padding: '12px 24px',
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => navigate('/inventory')}
          >
            <Target size={16} />
            📦 Inventory
          </button>
          <button 
            className="glass" 
            style={{ 
              borderRadius: 12, 
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => navigate('/')}
          >
            <Building2 size={16} />
            Create New Plan
          </button>
          <button 
            className="glass" 
            style={{ 
              borderRadius: 12, 
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onClick={() => {
              // Export business data
              const dataStr = JSON.stringify(model, null, 2)
              const dataBlob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement('a')
              link.href = url
              link.download = `${model?.name || 'business-plan'}.json`
              link.click()
              URL.revokeObjectURL(url)
            }}
          >
            <Target size={16} />
            Export Plan
          </button>
        </div>

        {/* Footer Message */}
        <div style={{ textAlign: 'center', padding: '32px 16px', color: '#666' }}>
          <p style={{ fontSize: '16px', margin: 0 }}>
            🎉 Congratulations! Your business plan is complete and ready for launch.
          </p>
          <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
            Use this dashboard to track your progress and stay focused on your goals.
          </p>
        </div>
      </div>
    </div>
  )
}

export default BusinessPage
