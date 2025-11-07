import Threads from '../components/Threads.jsx'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'
import '../App.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import JSZip from 'jszip'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, annotationPlugin)

function HomePage() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [models, setModels] = useState([]);
  const [scenario, setScenario] = useState(() => localStorage.getItem('bp_scenario') || 'base');
  const [showCumCustomers, setShowCumCustomers] = useState(() => (localStorage.getItem('bp_cumCustomers') || '0') === '1');
  const [showArpu, setShowArpu] = useState(() => (localStorage.getItem('bp_arpu') || '0') === '1');
  const [showMargin, setShowMargin] = useState(() => (localStorage.getItem('bp_margin') || '0') === '1');
  const [showMovingAvg, setShowMovingAvg] = useState(() => (localStorage.getItem('bp_movavg') || '0') === '1');
  const [metricsOpen, setMetricsOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [previousGenerations, setPreviousGenerations] = useState([]);
  const [showPreviousGenerations, setShowPreviousGenerations] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [modelCount, setModelCount] = useState(3);
  const [location, setLocation] = useState('');
  const [detailsModel, setDetailsModel] = useState(null);
  
  const examplePrompts = [
    "Food delivery service targeting office workers in downtown areas, focusing on healthy meal prep and 30-minute delivery",
    "SaaS tool for small restaurants to manage online orders, inventory, and customer analytics",
    "Subscription box for pet owners featuring monthly curated toys, treats, and health products",
    "Mobile app connecting freelance graphic designers with small businesses needing branding help",
    "Eco-friendly cleaning service for residential homes using only natural products and electric vehicles",
    "Online marketplace for local artisans to sell handmade jewelry, pottery, and crafts",
    "AI-powered fitness coaching app that creates personalized workout plans based on user goals",
    "Virtual reality training platform for healthcare professionals to practice surgical procedures"
  ];

  const generate = async (e) => {
    e?.preventDefault?.();
    setError('');
    if (!idea.trim()) { setError('Please describe your idea.'); return; }
    setLoading(true);
    try {
      const res = await apiFetch('/ai/business-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: idea.trim(), count: modelCount, location: location.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      const list = Array.isArray(data.models) ? data.models : [];
      setModels(list);
      // Refresh previous generations list after successful generation
      if (user) {
        fetchPreviousGenerations();
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousGenerations = async () => {
    if (!user) return;
    setLoadingPrevious(true);
    try {
      const res = await apiFetch('/ai/business-models/previous');
      const data = await res.json();
      if (res.ok) {
        setPreviousGenerations(data.generations || []);
      } else {
        console.error('Failed to fetch previous generations:', data.error);
      }
    } catch (err) {
      console.error('Error fetching previous generations:', err);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const loadPreviousGeneration = (generation) => {
    setModels(generation.models);
    
    // Extract location from the idea if it contains location info
    const ideaText = generation.idea;
    const locationMatch = ideaText.match(/\(Location: ([^)]+)\)/);
    if (locationMatch) {
      const extractedLocation = locationMatch[1];
      const extractedIdea = ideaText.replace(/ \(Location: [^)]+\)/, '');
      setIdea(extractedIdea);
      setLocation(extractedLocation);
    } else {
      setIdea(ideaText);
      setLocation('');
    }
    
    setShowPreviousGenerations(false);
  };

  const deletePreviousGeneration = async (id) => {
    try {
      const res = await apiFetch(`/ai/business-models/previous/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPreviousGenerations(prev => prev.filter(gen => gen.id !== id));
      } else {
        console.error('Failed to delete generation');
      }
    } catch (err) {
      console.error('Error deleting generation:', err);
    }
  };

  useEffect(() => {
    // Clear any existing localStorage data to prevent cross-account data sharing
    try {
      localStorage.removeItem('bp_models');
    } catch {}
    
    apiFetch('/auth/me')
      .then(r => r.json())
      .then(({ user, profileCompleted }) => {
        if (user && profileCompleted === false) {
          window.location.assign('/onboarding')
          return;
        }
        setUser(user || null)
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (user) {
      fetchPreviousGenerations();
    } else {
      // Clear models and previous generations when user logs out
      setModels([]);
      setPreviousGenerations([]);
    }
  }, [user])

  const exportCsv = (m) => {
    const sc = m.projections?.[scenario];
    if (!sc) return;
    const rows = [['Month','Revenue','Costs','Profit','Customers']];
    for (let i = 0; i < sc.months.length; i++) {
      const rev = sc.revenue[i] || 0;
      const cost = sc.costs[i] || 0;
      const profit = rev - cost;
      const cust = sc.customers[i] || 0;
      rows.push([sc.months[i], rev, cost, profit, cust]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${m.name}-${scenario}-projections.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadChartPng = (id, name) => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.png`;
    a.click();
  };

  const exportAll = async () => {
    const zip = new JSZip();
    // CSVs
    models.forEach((m) => {
      const sc = m.projections?.[scenario];
      if (!sc) return;
      const rows = [['Month','Revenue','Costs','Profit','Customers']];
      for (let i = 0; i < sc.months.length; i++) {
        const rev = sc.revenue[i] || 0;
        const cost = sc.costs[i] || 0;
        rows.push([sc.months[i], rev, cost, rev - cost, sc.customers[i] || 0]);
      }
      const csv = rows.map(r => r.join(',')).join('\n');
      zip.file(`${m.name}-${scenario}.csv`, csv);
    });
    // PNGs (only for visible charts)
    models.forEach((m, idx) => {
      const canvas = document.getElementById(`chart-rev-${idx}`);
      if (!canvas) return;
      const data = canvas.toDataURL('image/png').split(',')[1];
      zip.file(`${m.name}-${scenario}.png`, data, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bizpilot-${scenario}-exports.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectPlan = (model) => {
    try {
      localStorage.setItem('bp_selected_model', JSON.stringify(model));
      const planId = model?.id || model?.name || 'plan';
      localStorage.setItem(`bp_model_${planId}`, JSON.stringify(model));
      // Persist plan to server for cross-device access (best-effort)
      const tasksRaw = localStorage.getItem(`bp_checklist_${planId}`);
      let tasks = undefined; try { const t = JSON.parse(tasksRaw||'null'); if (Array.isArray(t)) tasks = t; } catch {}
      apiFetch('/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: planId, name: model.name, model, tasks })
      }).catch(() => {})
    } catch {}
    navigate('/plan');
  };

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Loading…</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#faf8f5', display: 'flex', flexDirection: 'column' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, background: '#faf8f5' }} />

      {/* Foreground content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 16, alignContent: 'start', padding: 16, flex: 1 }}>
        {user ? (
          <section style={{ padding: '64px 16px 24px', textAlign: 'center', color: '#111' }}>
            <h1 className="title" style={{ fontSize: 'clamp(34px,6vw,60px)', marginBottom: 10, color: '#111' }}>
            AI Business Planner
          </h1>
            <p style={{ fontSize: 'clamp(16px,2.4vw,20px)', maxWidth: 880, margin: '0 auto 18px', color: '#111' }}>
              Turn ideas into investor‑ready plans in minutes.
            </p>
          </section>
        ) : (
          <section style={{ padding: '64px 16px 0', color: '#111', background: 'transparent' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
              <h1 className="title" style={{ fontSize: 'clamp(40px,6.2vw,72px)', marginBottom: 14, color: '#111', fontWeight: 800 }}>
                Simple planning. Smarter decisions.
              </h1>
              <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', maxWidth: 880, margin: '0 auto 28px', color: '#111' }}>
                Transform your idea into a fundable plan with forecasts, benchmarks, and a launch checklist—no spreadsheets required.
              </p>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/login" className="cta" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 18, background: '#111', color: '#fff', textDecoration: 'none', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>Create free account</a>
                <a href="/login" className="cta" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 18, background: '#111', color: '#fff', textDecoration: 'none', boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}>Login</a>
              </div>
              <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', marginTop: 22, color: '#111', opacity: 0.9, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>4.8/5</span>
                  <span>Founder Reviews</span>
                </div>
                <span style={{ opacity: 0.25 }}>|</span>
                <div>Bank‑ready formatting • Real industry benchmarks • AI guidance</div>
              </div>
          </div>
        </section>
        )}

        {user ? (
        <Card title="Scenario" style={{ background: '#fefcf8', color: '#111', border: '1px solid #e8e0d0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
            {['base','best','worst'].map(s => (
              <button key={s} className={scenario === s ? 'primary' : 'glass'} style={{ borderRadius: 12, background: scenario === s ? '#4a7c59' : '#f5f1eb', color: scenario === s ? '#fff' : '#333' }} onClick={() => { setScenario(s); localStorage.setItem('bp_scenario', s); }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            <span style={{ opacity: 0.7 }}>|</span>
            <div>
              <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={() => setMetricsOpen(v => !v)}>Metrics ▾</button>
              {metricsOpen ? (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, background: '#fefcf8', border: '1px solid #e8e0d0', borderRadius: 12, padding: 12, display: 'grid', gap: 8, zIndex: 5, minWidth: 240, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#111' }}>
                    <input type="checkbox" checked={showArpu} onChange={(e) => { const v = e.target.checked; setShowArpu(v); localStorage.setItem('bp_arpu', v ? '1' : '0'); }} /> ARPU overlay
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#111' }}>
                    <input type="checkbox" checked={showCumCustomers} onChange={(e) => { const v = e.target.checked; setShowCumCustomers(v); localStorage.setItem('bp_cumCustomers', v ? '1' : '0'); }} /> Cumulative customers
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#111' }}>
                    <input type="checkbox" checked={showMargin} onChange={(e) => { const v = e.target.checked; setShowMargin(v); localStorage.setItem('bp_margin', v ? '1' : '0'); }} /> Profit margin % overlay
                  </label>
                  <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#111' }}>
                    <input type="checkbox" checked={showMovingAvg} onChange={(e) => { const v = e.target.checked; setShowMovingAvg(v); localStorage.setItem('bp_movavg', v ? '1' : '0'); }} /> 3‑month moving average (revenue)
                  </label>
                </div>
              ) : null}
            </div>
            <span style={{ opacity: 0.7 }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Models:</span>
              <select
                value={modelCount}
                onChange={(e) => setModelCount(parseInt(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e0d0',
                  background: '#fefcf8',
                  color: '#333',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
            <span style={{ flex: 1 }} />
            {models.length > 0 ? (
              <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={exportAll}>Export All</button>
            ) : null}
          </div>
        </Card>
        ) : null}

        {!user ? (
          <section style={{ padding: '40px 0 16px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ margin: '0 0 8px', color: '#111', textAlign: 'center' }}>Why founders choose Bizpilot</h2>
              <p style={{ margin: '0 auto 24px', maxWidth: 820, textAlign: 'center', color: '#333' }}>A focused toolkit that gets you from idea to investor‑ready plan without the clutter.</p>
              <div style={{ display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))' }}>
                {[{
                  h:'Create a plan', p:'Answer a few guided prompts to produce a polished plan investors understand.', icon:''
                },{
                  h:'Skip spreadsheets', p:'Auto‑build revenue, cost, and cash flow forecasts—editable anytime.', icon:''
                },{
                  h:'Real benchmarks', p:'Compare your numbers with industry data to set credible targets.', icon:''
                },{
                  h:'Launch checklist', p:'Turn your plan into a step‑by‑step execution list and track progress.', icon:''
                }].map((item, i) => (
                  <div key={i} style={{ background: '#fff', border: '1px solid #ececec', borderRadius: 20, padding: 26, boxShadow: '0 10px 28px rgba(0,0,0,0.06)', display: 'grid', gap: 8, alignContent: 'start' }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</div>
                    <h3 style={{ color: '#111', marginTop: 0, fontSize: 'clamp(18px,2.2vw,22px)' }}>{item.h}</h3>
                    <p style={{ color: '#111', margin: 0, fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.6 }}>{item.p}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {user ? (
        <Card 
          title="Generate business models" 
          style={{ background: '#fefcf8', color: '#111', border: '1px solid #e8e0d0' }}
        >
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowPreviousGenerations(!showPreviousGenerations)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#f5f1eb',
                border: '1px solid #e8e0d0',
                color: '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.background = '#ede7d9'; }}
              onMouseOut={(e) => { e.target.style.background = '#f5f1eb'; }}
            >
              My Previous Generations
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Location:</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., New York, London, Tokyo..."
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e8e0d0',
                  background: '#fefcf8',
                  color: '#333',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  minWidth: '200px'
                }}
              />
            </div>
          </div>
          <form onSubmit={generate} id="get-started" style={{ display: 'grid', gap: 16 }}>
            <div>
              <textarea
                placeholder="Describe your idea (e.g., Food Business targeting office workers, focus on meal prep, delivery radius, etc.)"
                value={idea}
                onChange={e => setIdea(e.target.value)}
                rows={4}
                style={{ width: '100%', resize: 'vertical', borderRadius: 12, padding: 16, fontSize: '16px', fontFamily: 'system-ui, -apple-system, sans-serif', border: '1px solid #e8e0d0', background: '#fefcf8' }}
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Try:</span>
                {examplePrompts.slice(0, 3).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdea(prompt)}
                    style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      background: '#f5f1eb', 
                      border: '1px solid #e8e0d0', 
                      color: '#333',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.background = '#ede7d9'; }}
                    onMouseOut={(e) => { e.target.style.background = '#f5f1eb'; }}
                  >
                    {prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="primary" style={{ borderRadius: 12, fontSize: '16px', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#4a7c59', color: '#fff' }} disabled={loading}>
                {loading ? 'Generating…' : 'Generate Models'}
              </button>
              {error ? <span style={{ color: '#ff6b6b', fontSize: '14px' }}>{error}</span> : null}
            </div>
          </form>

          {/* Results grid */}
          {models && models.length > 0 ? (
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: 12 }}>
              {models.map((m, idx) => {
                const sc = m.projections?.[scenario];
                const profit = (sc?.revenue || []).map((v, i) => (v - (sc?.costs?.[i] || 0)));
                const cumProfit = profit.reduce((acc, v, i) => { acc.push((acc[i-1] || 0) + v); return acc; }, []);
                const colorText = '#e5e5e5';
                const gridColor = 'rgba(255,255,255,0.08)';
                const breakEvenIndex = cumProfit.findIndex(x => x >= 0);
                const arpu = showArpu ? (sc.revenue.map((r, i) => {
                  const cust = sc.customers[i] || 1; return cust > 0 ? r / cust : 0;
                })) : null;
                const marginPct = showMargin ? (sc.revenue.map((r, i) => {
                  const pr = r - (sc.costs[i] || 0); return r > 0 ? (pr / r) * 100 : 0;
                })) : null;
                const movAvg = showMovingAvg ? (function(){
                  const arr = sc.revenue; const out = [];
                  for (let i=0;i<arr.length;i++){ const a = arr[i-2]||0, b=arr[i-1]||0, c=arr[i]||0; const n = i>=2?3:i+1; out.push((a+b+c)/n); }
                  return out;
                })() : null;
                return (
                  <section key={m.id} className="card" style={{ background: '#fefcf8', border: '1px solid #e8e0d0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ marginBottom: 6, color: '#111' }}>{m.name}</h3>
                    <p style={{ color: '#333', marginBottom: 8 }}>{m.description}</p>
                    {breakEvenIndex >= 0 ? (
                      <div style={{ display: 'inline-grid', background: '#e8f5e8', color: '#2d5a2d', padding: '6px 10px', borderRadius: 999, marginBottom: 8 }}>
                        Break-even: {sc.months[breakEvenIndex]}
                      </div>
                    ) : (
                      <div style={{ display: 'inline-grid', background: '#ffe8e8', color: '#8b2d2d', padding: '6px 10px', borderRadius: 999, marginBottom: 8 }}>
                        No break-even in 12 months
                      </div>
                    )}
                    {m.financialAssumptions ? (
                      <p style={{ color: '#666', marginBottom: 12 }}><strong>Assumptions:</strong> {m.financialAssumptions}</p>
                    ) : null}
                    {sc ? (
                      <div style={{ background: '#f5f1eb', padding: 8, borderRadius: 12, marginBottom: 12 }}>
                        <Line
                          id={`chart-rev-${idx}`}
                          data={{
                            labels: sc.months,
                            datasets: [
                              { label: 'Revenue', data: sc.revenue, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.2)', tension: 0.25 },
                              { label: 'Costs', data: sc.costs, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.2)', tension: 0.25 },
                              { label: 'Profit', data: profit, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.2)', tension: 0.25 },
                              { label: 'Cumulative Profit', data: cumProfit, borderColor: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.2)', borderDash: [6,4], tension: 0.25 },
                              ...(movAvg ? [{ label: 'Revenue (3m MA)', data: movAvg, borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,0.2)', borderDash: [4,4], tension: 0.25 }] : []),
                              ...(arpu ? [{ label: 'ARPU', data: arpu, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.2)', yAxisID: 'y1', tension: 0.25 }] : []),
                              ...(marginPct ? [{ label: 'Profit margin %', data: marginPct, borderColor: '#fde047', backgroundColor: 'rgba(253,224,71,0.2)', yAxisID: 'y1', tension: 0.25 }] : [])
                            ]
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { labels: { color: '#000' } },
                              annotation: breakEvenIndex >= 0 ? {
                                annotations: {
                                  breakeven: {
                                    type: 'line',
                                    xMin: breakEvenIndex,
                                    xMax: breakEvenIndex,
                                    borderColor: '#4a7c59',
                                    borderWidth: 2,
                                    label: { enabled: true, content: 'Break-even', color: '#000', backgroundColor: 'rgba(74,124,89,0.15)' }
                                  }
                                }
                              } : undefined
                            },
                            scales: {
                              x: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } },
                              y: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } },
                              y1: (arpu || marginPct) ? { position: 'right', ticks: { color: '#000' }, grid: { display: false } } : undefined
                            }
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={() => exportCsv(m)}>Export CSV</button>
                          <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={() => downloadChartPng(`chart-rev-${idx}`, `${m.name}-${scenario}`)}>Download PNG</button>
                        </div>
                      </div>
                    ) : null}
                    {sc ? (
                      <div style={{ background: '#f5f1eb', padding: 8, borderRadius: 12 }}>
                        <Line
                          id={`chart-cust-${idx}`}
                          data={{
                            labels: sc.months,
                            datasets: [
                              { label: showCumCustomers ? 'Cumulative Customers' : 'Customers', data: (function(){ if (!showCumCustomers) return sc.customers; const out=[]; return sc.customers.reduce((acc,v)=>{ acc.push((acc[acc.length-1]||0)+v); return acc; }, out); })(), borderColor: '#4a7c59', backgroundColor: 'rgba(74,124,89,0.2)', tension: 0.25 }
                            ]
                          }}
                          options={{
                            responsive: true,
                            plugins: { legend: { labels: { color: '#000' } } },
                            scales: {
                              x: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } },
                              y: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } }
                            }
                          }}
                        />
                      </div>
                    ) : null}
                    <ul style={{ color: '#333', lineHeight: 1.6, paddingLeft: 18, marginTop: 12 }}>
                      <li><strong>Customer:</strong> {m.targetCustomer}</li>
                      <li><strong>Value prop:</strong> {m.valueProp}</li>
                      <li><strong>Pricing:</strong> {m.pricing}</li>
                      <li><strong>Revenue:</strong> {m.revenueStreams}</li>
                      <li><strong>Startup costs:</strong> {m.startupCosts}</li>
                      <li><strong>Key activities:</strong> {m.keyActivities}</li>
                      <li><strong>Marketing:</strong> {m.marketingPlan}</li>
                      <li><strong>Operations:</strong> {m.operations}</li>
                      <li><strong>Risks:</strong> {m.risks}</li>
                    </ul>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                      <span style={{ flex: 1 }} />
                      <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={() => setDetailsModel(m)}>Details</button>
                      <button className="primary" style={{ borderRadius: 12, background: '#4a7c59', color: '#fff' }} onClick={() => handleSelectPlan(m)}>Select</button>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : null}
        </Card>
        ) : null}

        {/* Previous Generations Modal */}
        {showPreviousGenerations && user && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#111' }}>My Previous Generations</h2>
                <button
                  onClick={() => setShowPreviousGenerations(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '4px'
                  }}
                >
                  ×
                </button>
              </div>
              
              {loadingPrevious ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spinner />
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading previous generations...</p>
                </div>
              ) : previousGenerations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <p>No previous generations found.</p>
                  <p>Generate some business models to see them here!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {previousGenerations.map((generation) => (
                    <div
                      key={generation.id}
                      style={{
                        border: '1px solid #e8e0d0',
                        borderRadius: '12px',
                        padding: '16px',
                        background: '#fefcf8'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: '0 0 8px', color: '#111', fontSize: '16px' }}>
                            {generation.idea.length > 80 ? generation.idea.substring(0, 80) + '...' : generation.idea}
                          </h3>
                          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                            {new Date(generation.createdAt).toLocaleDateString()} at {new Date(generation.createdAt).toLocaleTimeString()}
                          </p>
                          <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
                            {generation.models.length} model{generation.models.length !== 1 ? 's' : ''} generated
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                          <button
                            onClick={() => loadPreviousGeneration(generation)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#4a7c59',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deletePreviousGeneration(generation.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#ff6b6b',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsModel ? (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
          }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 'min(980px, 94vw)', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ margin: 0, color: '#111' }}>{detailsModel.name}</h2>
              </div>
              <p style={{ color: '#333' }}>{detailsModel.description}</p>

              {/* KPIs */}
              {(() => {
                const sc = detailsModel.projections?.[scenario] || { months: [], revenue: [], costs: [], customers: [] };
                const profit = (sc.revenue || []).map((v, i) => (v - (sc.costs?.[i] || 0)));
                const totalRevenue = (sc.revenue || []).reduce((a,b)=>a+b,0);
                const totalCosts = (sc.costs || []).reduce((a,b)=>a+b,0);
                const totalProfit = profit.reduce((a,b)=>a+b,0);
                const customers = sc.customers || [];
                const avgArpu = customers.length ? (sc.revenue.reduce((a,b)=>a+b,0) / (customers.reduce((a,b)=>a+b,0) || 1)) : 0;
                const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
                const breakEvenIndex = profit.reduce((acc,v,i)=>{ const p=(acc.prev||0)+v; return { idx: acc.idx ?? (p>=0? i: undefined), prev: p } }, { idx: undefined, prev: 0 }).idx;
                const totalCustomers = (sc.customers || []).reduce((a,b)=>a+b,0);
                const bestMonthIdx = profit.length ? profit.indexOf(Math.max(...profit)) : undefined;
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Yearly Revenue</strong></div><div>${totalRevenue.toLocaleString()}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Yearly Costs</strong></div><div>${totalCosts.toLocaleString()}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Yearly Profit</strong></div><div>${totalProfit.toLocaleString()}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Avg ARPU</strong></div><div>${avgArpu.toFixed(2)}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Profit Margin</strong></div><div>{marginPct.toFixed(1)}%</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Break-even</strong></div><div>{typeof breakEvenIndex === 'number' ? sc.months[breakEvenIndex] : 'N/A'}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Yearly Customers</strong></div><div>{totalCustomers.toLocaleString()}</div></div>
                    <div className="card" style={{ background: '#fefcf8' }}><div><strong>Best Month</strong></div><div>{typeof bestMonthIdx === 'number' ? sc.months[bestMonthIdx] : 'N/A'}</div></div>
                  </div>
                );
              })()}

              {/* Compact Chart */}
              {(() => {
                const sc = detailsModel.projections?.[scenario];
                if (!sc || !Array.isArray(sc.revenue) || !Array.isArray(sc.costs)) return null;
                const profit = sc.revenue.map((r, i) => r - (sc.costs[i] || 0));
                const chartData = {
                  labels: sc.months,
                  datasets: [
                    { label: 'Revenue', data: sc.revenue, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.2)', tension: 0.25 },
                    { label: 'Costs', data: sc.costs, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.2)', tension: 0.25 },
                    { label: 'Profit', data: profit, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.2)', tension: 0.25 }
                  ]
                };
                const chartOptions = { responsive: true, plugins: { legend: { labels: { color: '#000' } } }, scales: { x: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } }, y: { ticks: { color: '#000' }, grid: { color: '#e8e0d0' } } } };
                return (
                  <div style={{ background: '#f5f1eb', padding: 10, borderRadius: 12, marginTop: 12 }}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                );
              })()}

              {/* Model-specific insights */}
              <div style={{ marginTop: 12 }}>
                <h3 style={{ color: '#111', margin: '12px 0 8px' }}>Model-specific Insights</h3>
                {(() => {
                  const bullets = [];
                  if (detailsModel.targetCustomer) {
                    bullets.push({
                      title: 'Market fit',
                      text: `Primary audience: ${detailsModel.targetCustomer}. Value: ${detailsModel.valueProp || 'N/A'}`
                    });
                  }
                  if (detailsModel.pricing || detailsModel.revenueStreams) {
                    bullets.push({
                      title: 'Monetization strategy',
                      text: `${detailsModel.pricing ? `Pricing: ${detailsModel.pricing}. ` : ''}${detailsModel.revenueStreams ? `Revenue: ${detailsModel.revenueStreams}.` : ''}`
                    });
                  }
                  if (detailsModel.keyActivities || detailsModel.operations) {
                    bullets.push({
                      title: 'Operations & activities',
                      text: `${detailsModel.keyActivities ? `Activities: ${detailsModel.keyActivities}. ` : ''}${detailsModel.operations ? `Ops: ${detailsModel.operations}.` : ''}`
                    });
                  }
                  if (detailsModel.marketingPlan) {
                    bullets.push({ title: 'Go-to-market', text: detailsModel.marketingPlan });
                  }
                  if (detailsModel.risks) {
                    bullets.push({ title: 'Risk profile', text: detailsModel.risks });
                  }
                  if (detailsModel.startupCosts) {
                    bullets.push({ title: 'Startup costs', text: detailsModel.startupCosts });
                  }
                  if (detailsModel.financialAssumptions) {
                    bullets.push({ title: 'Financial assumptions', text: detailsModel.financialAssumptions });
                  }
                  if (location) {
                    bullets.push({ title: 'Location context', text: `Tailor execution to ${location} (regulation, suppliers, culture).` });
                  }
                  return (
                    <ul style={{ color: '#333', lineHeight: 1.7, paddingLeft: 20 }}>
                      {bullets.map((b, i) => (
                        <li key={i}><strong>{b.title}</strong>: {b.text}</li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              {/* Location / Map */}
              {location ? (
                <div style={{ marginTop: 12 }}>
                  <h3 style={{ color: '#111', margin: '12px 0 8px' }}>Location Context</h3>
                  <div style={{ border: '1px solid #e8e0d0', borderRadius: 12, overflow: 'hidden' }}>
                    <iframe
                      title="map"
                      width="100%"
                      height="280"
                      style={{ border: 0, display: 'block' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
                    />
                  </div>
                </div>
              ) : null}

              {/* Structured details */}
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12 }}>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Target Customer</strong>
                  <div>{detailsModel.targetCustomer}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Value Proposition</strong>
                  <div>{detailsModel.valueProp}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Pricing</strong>
                  <div>{detailsModel.pricing}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Revenue Streams</strong>
                  <div>{detailsModel.revenueStreams}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Startup Costs</strong>
                  <div>{detailsModel.startupCosts}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Key Activities</strong>
                  <div>{detailsModel.keyActivities}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Marketing Plan</strong>
                  <div>{detailsModel.marketingPlan}</div>
                </div>
                <div className="card" style={{ background: '#fefcf8' }}>
                  <strong>Operations</strong>
                  <div>{detailsModel.operations}</div>
                </div>
              </div>

              {/* Actions at bottom */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="primary" style={{ borderRadius: 12, background: '#4a7c59', color: '#fff' }} onClick={() => handleSelectPlan(detailsModel)}>Add to my Checklist</button>
                <button className="glass" style={{ color: '#111', background: '#f5f1eb', borderRadius: 12 }} onClick={() => setDetailsModel(null)}>Close</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Workflow */}
        {!user ? (
        <section style={{ padding: '24px 0 64px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ border: '1px solid #ececec', background: '#fff', borderRadius: 24, padding: 36, boxShadow: '0 16px 40px rgba(0,0,0,0.08)' }}>
              <h2 style={{ margin: '0 0 18px', color: '#111', textAlign: 'center', fontSize: 'clamp(22px,3.2vw,30px)' }}>Get started in three steps</h2>
              <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div style={{ color: '#111' }}><h3 style={{ color: '#111' }}>1. Tell us your idea</h3><p style={{ color: '#111' }}>Two sentences is enough.</p></div>
                <div style={{ color: '#111' }}><h3 style={{ color: '#111' }}>2. Review options</h3><p style={{ color: '#111' }}>We generate multiple models with forecasts and risks.</p></div>
                <div style={{ color: '#111' }}><h3 style={{ color: '#111' }}>3. Save & execute</h3><p style={{ color: '#111' }}>Turn your pick into a checklist you can track.</p></div>
          </div>
          </div>
          </div>
        </section>
        ) : null}

        {/* Testimonials (logged-out only) */}
        {!user ? (
          <section style={{ padding: '8px 0 56px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ margin: '0 0 12px', color: '#111', textAlign: 'center' }}>What founders say</h2>
              <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, maskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 6%, black 94%, transparent)' }}>
                <div style={{ display: 'flex', gap: 16, padding: '4px 8px', width: 'max-content', animation: 'scroll-left 28s linear infinite' }}>
                  {(() => { const arr = [
                    { q: 'I had a plan investors understood in one afternoon.', a: 'SaaS founder' },
                    { q: 'The forecasts helped me price correctly from day one.', a: 'Café owner' },
                    { q: 'Turned my idea into an execution checklist—no spreadsheets.', a: 'Solo consultant' },
                    { q: 'Benchmarks gave us confidence our numbers were realistic.', a: 'E‑commerce team' },
                    { q: 'Fast, structured, and practical. Exactly what I needed.', a: 'Marketplace founder' }
                  ]; return [...arr, ...arr].map((t, i) => (
                    <div key={i} style={{ minWidth: 380, maxWidth: 420, background: '#fff', border: '1px solid #ececec', borderRadius: 14, padding: 18, boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                      <p style={{ color: '#111', margin: 0 }}>&ldquo;{t.q}&rdquo;</p>
                      <div style={{ marginTop: 8, color: '#555' }}>— {t.a}</div>
                    </div>
                  )) })()}
                </div>
              </div>
          </div>
        </section>
        ) : null}
      </div>
    </div>
  )
}

export default HomePage
