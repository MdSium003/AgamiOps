import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Spinner from '../components/Spinner.jsx'
import { apiFetch } from '../api'
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  BarChart3
} from 'lucide-react'
import * as XLSX from 'xlsx'

function InventoryPage() {
  const [inventoryData, setInventoryData] = useState([])
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewData, setPreviewData] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState('')
  const [photoResult, setPhotoResult] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [editData, setEditData] = useState({})
  const navigate = useNavigate()

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

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      parseFile(file)
    }
  }

  const parseFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target.result
        let workbook
        
        if (file.name.endsWith('.csv')) {
          // Handle CSV files
          const csvData = data.split('\n').map(row => row.split(','))
          const headers = csvData[0]
          const rows = csvData.slice(1).map(row => {
            const obj = {}
            headers.forEach((header, index) => {
              obj[header.trim()] = row[index] ? row[index].trim() : ''
            })
            return obj
          })
          setPreviewData(rows)
        } else {
          // Handle Excel files
          workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(sheet)
          setPreviewData(jsonData)
        }
        
        setShowPreview(true)
        setError('')
      } catch (err) {
        setError('Failed to parse file. Please check the file format.')
        console.error('File parsing error:', err)
      }
    }
    
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result
      if (typeof url === 'string') setPhotoDataUrl(url)
    }
    reader.readAsDataURL(file)
  }

  const analyzePhoto = async () => {
    if (!photoDataUrl) { setError('Please choose a photo first'); return }
    try {
      setUploading(true)
      const res = await apiFetch('/inventory/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: photoDataUrl, fileName: 'product_photo.png' })
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok) throw new Error(data.error || 'Image analysis failed')
      setPhotoResult(data)
      setSuccess('Photo analyzed successfully')
      setTimeout(()=>setSuccess(''), 2500)
    } catch (e) {
      setError(e.message || 'Image analysis failed')
    } finally {
      setUploading(false)
    }
  }

  const uploadInventoryData = async () => {
    if (previewData.length === 0) {
      setError('No data to upload')
      return
    }

    try {
      setUploading(true)
      const response = await apiFetch('/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: previewData,
          fileName: selectedFile?.name || 'uploaded_file'
        })
      })

      if (response.ok) {
        setSuccess('Inventory data uploaded successfully!')
        setShowPreview(false)
        setSelectedFile(null)
        setPreviewData([])
        loadInventoryData() // Reload data
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to upload inventory data')
      }
    } catch (e) {
      setError('Failed to upload inventory data')
    } finally {
      setUploading(false)
    }
  }

  const deleteInventoryItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await apiFetch(`/inventory/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Item deleted successfully!')
        loadInventoryData() // Reload data
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete item')
      }
    } catch (e) {
      setError('Failed to delete item')
    }
  }

  const startEdit = (row) => {
    setEditingRow(row.id)
    setEditData({ ...row })
  }

  const saveEdit = async () => {
    try {
      const response = await apiFetch(`/inventory/${editingRow}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setSuccess('Item updated successfully!')
        setEditingRow(null)
        setEditData({})
        loadInventoryData() // Reload data
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to update item')
      }
    } catch (e) {
      setError('Failed to update item')
    }
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditData({})
  }

  const exportInventory = () => {
    if (inventoryData.length === 0) {
      setError('No data to export')
      return
    }

    const ws = XLSX.utils.json_to_sheet(inventoryData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
    XLSX.writeFile(wb, 'inventory_export.xlsx')
  }

  const filteredData = inventoryData.filter(item => {
    if (!searchTerm) return true
    return Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
            <span>Loading inventory...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Please log in to view inventory</h2>
          <button className="primary" style={{ borderRadius: 12 }} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    )
  }

  const columns = inventoryData.length > 0 ? Object.keys(inventoryData[0]) : []

  return (
    <div style={{ minHeight: '100vh', padding: 16, background: '#faf8f5' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gap: 24 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <Package size={48} color="#2563eb" />
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#111', margin: 0 }}>
              Inventory Management
            </h1>
          </div>
          <p style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            Upload and manage your inventory data with Excel/CSV files
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{ 
            padding: 12, 
            background: '#f0f9f0', 
            border: '1px solid #4a7c59', 
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#4a7c59'
          }}>
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

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
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Upload Section */}
        <Card title="Upload Inventory Data" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ 
              border: '2px dashed #2563eb', 
              borderRadius: 12, 
              padding: 32, 
              textAlign: 'center',
              background: '#f8fafc'
            }}>
              <Upload size={48} color="#2563eb" style={{ marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8, color: '#111' }}>Upload Excel or CSV File</h3>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Supported formats: .xlsx, .xls, .csv
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: 'white',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Choose File
              </label>
              {selectedFile && (
                <p style={{ marginTop: 12, color: '#4a7c59', fontWeight: 'bold' }}>
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Photo upload for product/quality analysis */}
            <div className="card" style={{ background: '#fff', border: '1px dashed #9ca3af', padding: 16, borderRadius: 12 }}>
              <h4 style={{ margin: 0, color: '#111' }}>Product Photo (Optional)</h4>
              <p style={{ margin: '4px 0 12px 0', color: '#666' }}>Upload a photo of your product to estimate visible item count and quality.</p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" id="photo-upload" style={{ display: 'none' }} onChange={handlePhotoSelect} />
                <label htmlFor="photo-upload" className="glass" style={{ padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Choose Photo</label>
                <button className="glass" style={{ padding: '10px 16px', borderRadius: 8 }} onClick={analyzePhoto} disabled={!photoDataUrl || uploading}>
                  {uploading ? 'Analyzing…' : 'Analyze Photo'}
                </button>
              </div>
              {photoDataUrl && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px,300px) 1fr', gap: 16, marginTop: 12, alignItems: 'start' }}>
                  <img src={photoDataUrl} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <div>
                    {photoResult ? (
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div><strong>Estimated Count:</strong> {photoResult.estimatedCount}</div>
                        <div><strong>Quality:</strong> {photoResult.quality}</div>
                        <div><strong>Product Type:</strong> {photoResult.productType}</div>
                        {photoResult.note && <div style={{ color: '#666' }}>{photoResult.note}</div>}
                      </div>
                    ) : (
                      <div style={{ color: '#666' }}>Click "Analyze Photo" to see results.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {showPreview && previewData.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 12, color: '#111' }}>Preview ({previewData.length} rows)</h4>
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'auto', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8 
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                      <tr>
                        {Object.keys(previewData[0]).map((key, index) => (
                          <th key={index} style={{ 
                            padding: '8px 12px', 
                            textAlign: 'left', 
                            borderBottom: '1px solid #e5e7eb',
                            fontWeight: 'bold',
                            color: '#111'
                          }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i} style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              color: '#666'
                            }}>
                              {String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <div style={{ padding: 12, textAlign: 'center', color: '#666', background: '#f9fafb' }}>
                      ... and {previewData.length - 10} more rows
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center' }}>
                  <button 
                    className="primary" 
                    style={{ 
                      borderRadius: 8, 
                      padding: '12px 24px',
                      background: '#4a7c59',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                    onClick={uploadInventoryData}
                    disabled={uploading}
                  >
                    {uploading ? <Spinner /> : <Save size={16} />}
                    {uploading ? 'Uploading...' : 'Upload Data'}
                  </button>
                  <button 
                    className="glass" 
                    style={{ borderRadius: 8, padding: '12px 24px' }}
                    onClick={() => {
                      setShowPreview(false)
                      setSelectedFile(null)
                      setPreviewData([])
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Inventory Data Display */}
        {inventoryData.length > 0 && (
          <Card title="Inventory Data" style={{ background: '#fefcf8', border: '1px solid #e8e0d0' }}>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Search and Actions */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                  <Search size={20} style={{ 
                    position: 'absolute', 
                    left: 12, 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#666' 
                  }} />
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: '16px'
                    }}
                  />
                </div>
                <button 
                  className="primary" 
                  style={{ 
                    borderRadius: 8, 
                    padding: '12px 16px',
                    background: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onClick={() => navigate('/inventory/ai-analysis')}
                >
                  <BarChart3 size={16} />
                  🤖 AI Suggestions
                </button>
                <button 
                  className="glass" 
                  style={{ 
                    borderRadius: 8, 
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onClick={exportInventory}
                >
                  <Download size={16} />
                  Export
                </button>
              </div>

              {/* Data Table */}
              <div style={{ 
                maxHeight: '600px', 
                overflow: 'auto', 
                border: '1px solid #e5e7eb', 
                borderRadius: 8 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                    <tr>
                      {columns.map((column, index) => (
                        <th key={index} style={{ 
                          padding: '12px 16px', 
                          textAlign: 'left', 
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold',
                          color: '#111',
                          minWidth: '120px'
                        }}>
                          {column}
                        </th>
                      ))}
                      <th style={{ 
                        padding: '12px 16px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold',
                        color: '#111',
                        width: '120px'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row, index) => (
                      <tr key={row.id || index} style={{ 
                        background: editingRow === row.id ? '#fef3c7' : 'white',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} style={{ 
                            padding: '12px 16px',
                            color: '#666'
                          }}>
                            {editingRow === row.id ? (
                              <input
                                type="text"
                                value={editData[column] || ''}
                                onChange={(e) => setEditData(prev => ({ ...prev, [column]: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: 4,
                                  fontSize: '14px'
                                }}
                              />
                            ) : (
                              String(row[column] || '')
                            )}
                          </td>
                        ))}
                        <td style={{ 
                          padding: '12px 16px',
                          textAlign: 'center'
                        }}>
                          {editingRow === row.id ? (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button 
                                onClick={saveEdit}
                                style={{
                                  background: '#4a7c59',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Save size={14} />
                              </button>
                              <button 
                                onClick={cancelEdit}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                              <button 
                                onClick={() => startEdit(row)}
                                style={{
                                  background: '#2563eb',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => deleteInventoryItem(row.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ textAlign: 'center', color: '#666', padding: 16 }}>
                Showing {filteredData.length} of {inventoryData.length} items
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {inventoryData.length === 0 && (
          <Card style={{ background: '#fefcf8', border: '1px solid #e8e0d0', textAlign: 'center' }}>
            <Package size={64} color="#d1d5db" style={{ marginBottom: 16 }} />
            <h3 style={{ marginBottom: 8, color: '#111' }}>No Inventory Data</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Upload your first Excel or CSV file to get started with inventory management.
            </p>
          </Card>
        )}

        {/* Back Button */}
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
            onClick={() => navigate('/business')}
          >
            <BarChart3 size={16} />
            Back to Business Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default InventoryPage
