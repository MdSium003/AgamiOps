import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'
import { apiFetch } from '../api'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  LineChart,
  ArrowLeft,
  RefreshCw,
  Download,
  Lightbulb,
  Target,
  Calendar,
  Users,
  ShoppingCart,
  Truck,
  MapPinned,
  Route
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line, Bar, Pie } from 'react-chartjs-2'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from 'react-leaflet'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

function InventoryAIAnalysisPage() {
  const [inventoryData, setInventoryData] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [selectedSupplierIdx, setSelectedSupplierIdx] = useState(-1)

  useEffect(() => {
    // Check if user is logged in
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user }) => setUser(user || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (user) {
      loadInventoryData()
    }
  }, [user])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      const response = await apiFetch('/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryData(data.inventory || [])
      } else {
        setError('Failed to load inventory data')
      }
    } catch (e) {
      setError('Failed to load inventory data')
    } finally {
      setLoading(false)
    }
  }

  const runAIAnalysis = async () => {
    if (inventoryData.length === 0) {
      setError('No inventory data available for analysis')
      return
    }

    try {
      setAnalyzing(true)
      setError('')
      
      const response = await apiFetch('/ai/inventory-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventoryData })
      })

      if (response.ok) {
        const analysisData = await response.json()
        setAnalysis(analysisData)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to analyze inventory data')
      }
    } catch (e) {
      setError('Failed to analyze inventory data')
    } finally {
      setAnalyzing(false)
    }
  }

  const exportAnalysis = () => {
    if (!analysis) return
    
    const reportData = {
      timestamp: new Date().toISOString(),
      inventoryCount: inventoryData.length,
      analysis: analysis
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'inventory-analysis-report.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const getMapCenter = () => {
    const fac = getSuppliers()
    if (fac.length === 0) return [20, 0]
    const coords = fac
      .map(f => [Number(f.lat), Number(f.lng)])
      .filter(([a,b]) => Number.isFinite(a) && Number.isFinite(b))
    if (coords.length === 0) return [20, 0]
    const lat = coords.reduce((s,c)=>s+c[0],0)/coords.length
    const lng = coords.reduce((s,c)=>s+c[1],0)/coords.length
    return [lat, lng]
  }

  const mockSuppliers = [
    { name: 'Tejgaon Industrial Area', location: 'Dhaka, Bangladesh', lat: 23.7695, lng: 90.4125, distanceKm: 6, leadTimeDays: 1, reliabilityScore: 90, notes: 'Central industrial hub' },
    { name: 'Savar EPZ', location: 'Dhaka Division, Bangladesh', lat: 23.8403, lng: 90.2650, distanceKm: 30, leadTimeDays: 2, reliabilityScore: 86, notes: 'Export Processing Zone' },
    { name: 'Gazipur Industrial Belt', location: 'Gazipur, Bangladesh', lat: 23.9999, lng: 90.4203, distanceKm: 35, leadTimeDays: 2, reliabilityScore: 83, notes: 'Textile and garments' },
    { name: 'Narayanganj Manufacturing Cluster', location: 'Narayanganj, Bangladesh', lat: 23.6238, lng: 90.5000, distanceKm: 20, leadTimeDays: 2, reliabilityScore: 82, notes: 'Light manufacturing' },
    { name: 'Ashulia Industrial Zone', location: 'Ashulia, Dhaka', lat: 23.9084, lng: 90.2792, distanceKm: 25, leadTimeDays: 2, reliabilityScore: 84, notes: 'Factories and warehouses' }
  ]

  const getSuppliers = () => {
    const list = analysis?.supplyChain?.suppliers || []
    const enriched = list.map(s => ({ ...s, lat: Number(s.lat), lng: Number(s.lng) }))
    const validCount = enriched.filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng)).length
    if (enriched.length === 0 || validCount === 0) return mockSuppliers
    return enriched
  }

  const focusSupplier = (s) => {
    const lat = Number(s.lat)
    const lng = Number(s.lng)
    if (mapRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
      try { mapRef.current.flyTo([lat, lng], 12, { duration: 1.2 }) } catch {}
    }
  }

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'restock': return <TrendingUp size={20} color="#ef4444" />
      case 'reduce': return <TrendingDown size={20} color="#f59e0b" />
      case 'optimal': return <CheckCircle2 size={20} color="#10b981" />
      case 'warning': return <AlertTriangle size={20} color="#f59e0b" />
      default: return <Lightbulb size={20} color="#6366f1" />
    }
  }

  const getSuggestionColor = (type) => {
    switch (type) {
      case 'restock': return '#fef2f2'
      case 'reduce': return '#fffbeb'
      case 'optimal': return '#f0fdf4'
      case 'warning': return '#fffbeb'
      default: return '#f8fafc'
    }
  }

  const getSuggestionBorderColor = (type) => {
    switch (type) {
      case 'restock': return '#ef4444'
      case 'reduce': return '#f59e0b'
      case 'optimal': return '#10b981'
      case 'warning': return '#f59e0b'
      default: return '#6366f1'
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Loading inventory data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Please log in to view AI analysis</h2>
          <button className="primary" style={{ borderRadius: 12 }} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    )
  }

  if (inventoryData.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Package size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8, color: '#111' }}>No Inventory Data</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>
            Upload inventory data first to run AI analysis.
          </p>
          <button className="primary" style={{ borderRadius: 12 }} onClick={() => navigate('/inventory')}>
            Go to Inventory
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#faf8f5' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gap: 24 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <Brain size={48} color="#7c3aed" />
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#111', margin: 0 }}>
              AI Inventory Analysis
            </h1>
          </div>
          <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto 24px' }}>
            Get intelligent insights, predictions, and recommendations for your inventory
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="primary" 
              style={{ 
                borderRadius: 12, 
                padding: '12px 24px',
                background: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onClick={runAIAnalysis}
              disabled={analyzing}
            >
              {analyzing ? <Spinner /> : <Brain size={16} />}
              {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
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
              onClick={() => navigate('/inventory')}
            >
              <ArrowLeft size={16} />
              Back to Inventory
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: 12, 
            background: '#fef2f2', 
            border: '1px solid #ef4444', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#ef4444'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: '#7c3aed', 
                    borderRadius: 12, 
                    padding: 12, 
                    display: 'grid', 
                    placeItems: 'center' 
                  }}>
                    <Package size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#111' }}>Total Items</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#7c3aed' }}>
                      {analysis.summary?.totalItems || inventoryData.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: '#10b981', 
                    borderRadius: 12, 
                    padding: 12, 
                    display: 'grid', 
                    placeItems: 'center' 
                  }}>
                    <DollarSign size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#111' }}>Estimated Value</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                      ${analysis.summary?.totalValue?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: '#f59e0b', 
                    borderRadius: 12, 
                    padding: 12, 
                    display: 'grid', 
                    placeItems: 'center' 
                  }}>
                    <AlertTriangle size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#111' }}>Low Stock Items</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                      {analysis.summary?.lowStockCount || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    background: '#ef4444', 
                    borderRadius: 12, 
                    padding: 12, 
                    display: 'grid', 
                    placeItems: 'center' 
                  }}>
                    <TrendingDown size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#111' }}>Overstock Items</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                      {analysis.summary?.overstockCount || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* AI Suggestions */}
            <Card title="🤖 AI Recommendations" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
              <div style={{ display: 'grid', gap: 16 }}>
                {analysis.suggestions?.map((suggestion, index) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: 16, 
                      background: getSuggestionColor(suggestion.type),
                      borderRadius: 12, 
                      border: `2px solid ${getSuggestionBorderColor(suggestion.type)}`,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#111' }}>{suggestion.title}</h4>
                      <p style={{ margin: '0 0 8px 0', color: '#666' }}>{suggestion.description}</p>
                      {suggestion.impact && (
                        <p style={{ margin: 0, fontSize: '14px', color: '#7c3aed', fontWeight: 'bold' }}>
                          💡 Impact: {suggestion.impact}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Supply Chain & Logistics */}
            {analysis.supplyChain && (
              <Card title="🚚 Supply Chain & Routing" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ 
                    padding: 12,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    color: '#111'
                  }}>
                    {analysis.supplyChain.summary}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                    {analysis.supplyChain.suppliers?.map((s, i) => (
                      <div key={i} className="card" style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Truck size={18} color="#2563eb" />
                            <strong>{s.name}</strong>
                          </div>
                          <span style={{ fontSize: 12, color: '#666' }}>{s.location}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span className="glass" style={{ padding: '2px 8px', borderRadius: 999 }}>Distance: {Number(s.distanceKm || 0).toFixed(0)} km</span>
                          <span className="glass" style={{ padding: '2px 8px', borderRadius: 999 }}>Lead time: {s.leadTimeDays || 0} days</span>
                          <span className="glass" style={{ padding: '2px 8px', borderRadius: 999 }}>Reliability: {s.reliabilityScore || 0}%</span>
                        </div>
                        {s.notes && <div style={{ color: '#666', marginBottom: 8 }}>{s.notes}</div>}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {s.routeLink && (
                            <a href={s.routeLink} target="_blank" rel="noreferrer" className="primary" style={{ borderRadius: 8, padding: '8px 12px' }}>
                              <Route size={14} />
                              <span style={{ marginLeft: 6 }}>Open Route</span>
                            </a>
                          )}
                          {s.mapEmbedUrl && (
                            <details style={{ width: '100%' }}>
                              <summary className="glass" style={{ display: 'inline-block', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>
                                <MapPinned size={14} style={{ marginRight: 6 }} /> View Map
                              </summary>
                              <div style={{ marginTop: 8 }}>
                                <iframe
                                  src={s.mapEmbedUrl}
                                  width="100%"
                                  height="240"
                                  style={{ border: 0, borderRadius: 8 }}
                                  loading="lazy"
                                  referrerPolicy="no-referrer-when-downgrade"
                                  title={`Map-${i}`}
                                />
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {analysis.supplyChain.recommendations?.length > 0 && (
                    <div>
                      <h4 style={{ margin: '8px 0 12px 0', color: '#111' }}>Optimization Recommendations</h4>
                      <div style={{ display: 'grid', gap: 12 }}>
                        {analysis.supplyChain.recommendations.map((r, idx) => (
                          <div key={idx} style={{
                            padding: 12,
                            background: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: 8
                          }}>
                            <strong style={{ color: '#0ea5e9' }}>{r.title}</strong>
                            <p style={{ margin: '6px 0 0 0', color: '#555' }}>{r.description}</p>
                            {r.impact && (
                              <div style={{ marginTop: 6, fontSize: 12, color: '#0369a1' }}>Impact: {r.impact}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Charts and Visualizations */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
              
              {/* Stock Level Distribution */}
              {analysis.charts?.stockDistribution && (
                <Card title="Stock Level Distribution" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ height: '300px' }}>
                    <Pie
                      data={analysis.charts.stockDistribution}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Value Distribution */}
              {analysis.charts?.valueDistribution && (
                <Card title="Value Distribution" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ height: '300px' }}>
                    <Bar
                      data={analysis.charts.valueDistribution}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Sales Prediction */}
              {analysis.charts?.salesPrediction && (
                <Card title="Sales Prediction (Next 6 Months)" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ height: '300px' }}>
                    <Line
                      data={analysis.charts.salesPrediction}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Category Analysis */}
              {analysis.charts?.categoryAnalysis && (
                <Card title="Category Analysis" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ height: '300px' }}>
                    <Bar
                      data={analysis.charts.categoryAnalysis}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Sustainability: Waste to Asset */}
              <Card title="Waste to Asset" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="card" style={{ padding: 12, background: '#f0fdf4', border: '1px solid #10b981' }}>
                    <strong>Repurpose Offcuts</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Turn leather/textile scraps into keychains, coasters, or sample kits.</div>
                  </div>
                  <div className="card" style={{ padding: 12, background: '#eff6ff', border: '1px solid #2563eb' }}>
                    <strong>Recycle Packaging</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Shred cardboard into filler or work with local recyclers.</div>
                  </div>
                  <div className="card" style={{ padding: 12, background: '#fff7ed', border: '1px solid #f59e0b' }}>
                    <strong>Refurbish Returns</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Grade B items can be repaired and sold as outlet stock.</div>
                  </div>
                </div>
              </Card>

              {/* Sustainability: Environment Friendly */}
              <Card title="Eco Actions" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="card" style={{ padding: 12, background: '#f0f9ff', border: '1px solid #38bdf8' }}>
                    <strong>Green Materials</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Prioritize recycled plastics, organic cotton, or FSC paper.</div>
                  </div>
                  <div className="card" style={{ padding: 12, background: '#fef2f2', border: '1px solid #ef4444' }}>
                    <strong>Optimize Shipping</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Consolidate orders and choose regional suppliers to cut emissions.</div>
                  </div>
                  <div className="card" style={{ padding: 12, background: '#ecfeff', border: '1px solid #06b6d4' }}>
                    <strong>Energy Efficiency</strong>
                    <div style={{ fontSize: 14, color: '#555' }}>Switch to LED lighting and schedule off-peak production.</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Supply Chain Overview */}
            {(analysis.supplyChain?.suppliers?.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
                <Card title="Supply Chain Map" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ height: 360, borderRadius: 12, overflow: 'hidden' }}>
                    <MapContainer center={getMapCenter()} zoom={3} style={{ height: '100%', width: '100%' }} whenCreated={(map) => { mapRef.current = map }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                      {getSuppliers().map((s, idx) => (
                        Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)) ? (
                          <CircleMarker
                            key={idx}
                            center={[Number(s.lat), Number(s.lng)]}
                            radius={8}
                            pathOptions={{ color: selectedSupplierIdx === idx ? '#16a34a' : '#2563eb', weight: 3, fillOpacity: 0.8 }}
                            eventHandlers={{ click: () => { setSelectedSupplierIdx(idx); focusSupplier(s) } }}
                          >
                            <Popup>
                              <div style={{ maxWidth: 220 }}>
                                <div style={{ fontWeight: 700 }}>{s.name}</div>
                                <div style={{ fontSize: 12, color: '#555' }}>{s.location}</div>
                                {s.notes ? <div style={{ marginTop: 6 }}>{s.notes}</div> : null}
                              </div>
                            </Popup>
                          </CircleMarker>
                        ) : null
                      ))}
                      {Array.isArray(analysis.supplyChain.routes) && analysis.supplyChain.routes.length > 0 && (
                        analysis.supplyChain.routes.map((r, idx) => (
                          Array.isArray(r.polyline) && r.polyline.length > 1 ? (
                            <Polyline key={idx} positions={r.polyline.map(p => [Number(p[0]), Number(p[1])])} pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.8 }} />
                          ) : null
                        ))
                      )}
                    </MapContainer>
                  </div>
                  {analysis.supplyChain?.summary ? (
                    <p style={{ marginTop: 12, color: '#555' }}>{analysis.supplyChain.summary}</p>
                  ) : null}
                </Card>

                <Card title="Nearest Suppliers & Routes" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {getSuppliers().map((s, idx) => (
                      <div key={idx} className="card" style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{s.location}</div>
                          <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                            {Number.isFinite(Number(s.distanceKm)) && <span>Distance: {Number(s.distanceKm).toFixed(0)} km</span>}
                            {Number.isFinite(Number(s.leadTimeDays)) && <span>Lead time: {Number(s.leadTimeDays)} days</span>}
                            {Number.isFinite(Number(s.reliabilityScore)) && <span>Reliability: {Number(s.reliabilityScore)}%</span>}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gap: 8, justifyContent: 'end' }}>
                          {Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)) && (
                            <button onClick={() => { setSelectedSupplierIdx(idx); focusSupplier(s) }} className="glass" style={{ padding: '6px 10px', borderRadius: 8 }}>
                              View on Map
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Detailed Analysis */}
            <Card title="📊 Detailed Analysis" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
              <div style={{ display: 'grid', gap: 24 }}>
                
                {/* Top Performing Items */}
                {analysis.topPerformers && (
                  <div>
                    <h4 style={{ marginBottom: 16, color: '#111' }}>🏆 Top Performing Items</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {analysis.topPerformers.map((item, index) => (
                        <div key={index} style={{ 
                          padding: 12, 
                          background: '#f0fdf4', 
                          borderRadius: 8, 
                          border: '1px solid #10b981',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <strong>{item.name || `Item ${index + 1}`}</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                              {item.reason}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                              {item.value ? `$${item.value.toLocaleString()}` : 'High Value'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items Needing Attention */}
                {analysis.attentionItems && (
                  <div>
                    <h4 style={{ marginBottom: 16, color: '#111' }}>⚠️ Items Needing Attention</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {analysis.attentionItems.map((item, index) => (
                        <div key={index} style={{ 
                          padding: 12, 
                          background: '#fef2f2', 
                          borderRadius: 8, 
                          border: '1px solid #ef4444',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <strong>{item.name || `Item ${index + 1}`}</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                              {item.issue}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                              {item.action}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Future Predictions */}
                {analysis.predictions && (
                  <div>
                    <h4 style={{ marginBottom: 16, color: '#111' }}>🔮 Future Predictions</h4>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {analysis.predictions.map((prediction, index) => (
                        <div key={index} style={{ 
                          padding: 12, 
                          background: '#f8fafc', 
                          borderRadius: 8, 
                          border: '1px solid #6366f1'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Calendar size={16} color="#6366f1" />
                            <strong style={{ color: '#111' }}>{prediction.timeframe}</strong>
                          </div>
                          <p style={{ margin: 0, color: '#666' }}>{prediction.description}</p>
                          {prediction.confidence && (
                            <div style={{ marginTop: 8, fontSize: '14px', color: '#7c3aed' }}>
                              Confidence: {prediction.confidence}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Export Analysis */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                className="glass" 
                style={{ 
                  borderRadius: 12, 
                  padding: '12px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onClick={exportAnalysis}
              >
                <Download size={16} />
                Export Analysis Report
              </button>
            </div>
          </>
        )}

        {/* No Analysis State */}
        {!analysis && !analyzing && (
          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0', textAlign: 'center' }}>
            <Brain size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8, color: '#111' }}>Ready for AI Analysis</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Click "Run AI Analysis" to get intelligent insights about your inventory.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <CheckCircle2 size={16} color="#10b981" />
                Stock Level Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <CheckCircle2 size={16} color="#10b981" />
                Revenue Predictions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <CheckCircle2 size={16} color="#10b981" />
                Smart Recommendations
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <CheckCircle2 size={16} color="#10b981" />
                Visual Analytics
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default InventoryAIAnalysisPage
