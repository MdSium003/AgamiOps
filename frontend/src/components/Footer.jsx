import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer style={{ 
      background: 'var(--background)', 
      borderTop: '1px solid var(--border)',
      padding: '48px 16px 24px',
      marginTop: 'auto'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '32px',
        marginBottom: '32px'
      }}>
        {/* Company Info */}
        <div>
          <h3 style={{ 
            marginBottom: '16px', 
            color: 'var(--foreground)',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            BizPilot
          </h3>
          <p style={{ 
            color: 'var(--muted-foreground)', 
            lineHeight: '1.6',
            marginBottom: '16px'
          }}>
            Transform your business ideas into actionable plans with AI-powered insights, 
            comprehensive forecasting, and collaborative tools.
          </p>
          <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} BizPilot. All rights reserved.
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ 
            marginBottom: '16px', 
            color: 'var(--foreground)',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Quick Links
          </h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <li>
              <Link to="/" style={{ 
                color: 'var(--muted-foreground)', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted-foreground)'}
              >
                Home
              </Link>
            </li>
            <li>
              <Link to="/marketplace" style={{ 
                color: 'var(--muted-foreground)', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted-foreground)'}
              >
                Marketplace
              </Link>
            </li>
            <li>
              <Link to="/about-us" style={{ 
                color: 'var(--muted-foreground)', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted-foreground)'}
              >
                About Us
              </Link>
            </li>
            <li>
              <Link to="/login" style={{ 
                color: 'var(--muted-foreground)', 
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--foreground)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--muted-foreground)'}
              >
                Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Features */}
        <div>
          <h4 style={{ 
            marginBottom: '16px', 
            color: 'var(--foreground)',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Features
          </h4>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <li style={{ color: 'var(--muted-foreground)' }}>AI Business Models</li>
            <li style={{ color: 'var(--muted-foreground)' }}>Financial Forecasting</li>
            <li style={{ color: 'var(--muted-foreground)' }}>Execution Checklists</li>
            <li style={{ color: 'var(--muted-foreground)' }}>Collaboration Tools</li>
            <li style={{ color: 'var(--muted-foreground)' }}>Market Analysis</li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div style={{ 
        borderTop: '1px solid var(--border)',
        paddingTop: '24px',
        textAlign: 'center',
        color: 'var(--muted-foreground)',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: 0 }}>
          Built with ❤️ for entrepreneurs and business innovators
        </p>
      </div>
    </footer>
  )
}

export default Footer

