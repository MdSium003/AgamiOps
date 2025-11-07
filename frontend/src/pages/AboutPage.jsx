import { Target, Eye, Heart, Mail, Github, Facebook } from "lucide-react";

const DeveloperCard = ({ name, role, email, avatar, description, githubUrl, facebookUrl }) => {
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;
  return (
    <div 
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: '0',
        borderRadius: 20,
        background: 'transparent',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)'
      }}
    >
      <div 
        style={{
          position: 'relative',
          height: 320,
          backgroundImage: `url(${avatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.15) 60%, transparent)' }} />
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 20, color: '#fff' }}>
          <h3 style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)', fontWeight: 800, margin: 0 }}>{name}</h3>
          <div style={{ color: '#c4b5fd', fontWeight: 700, marginTop: 4 }}>{role}</div>
          <p style={{ marginTop: 8, maxWidth: 560, lineHeight: 1.5, opacity: 0.95 }}>{description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="glass" style={{ color: '#111', background: '#fff', padding: '10px 16px', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Mail size={16} /> Contact</span>
            </a>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.85)' }}><Github size={18} /></a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.85)' }}><Facebook size={18} /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AboutPage() {
  const aboutData = {
    title: "About Us",
    content: "BizPilot is an AI-powered assistant for small businesses and entrepreneurs. It helps transform raw ideas into strategic business plans with roadmaps, forecasts, and simulations.",
    mission: "To simplify entrepreneurship by providing AI-driven guidance, making business ideation, validation, and execution accessible to everyone.",
    vision: "A future where anyone with an idea can launch a business in minutes, not months.",
    values: "Innovation, accessibility, transparency, collaboration, and empowerment.",
    imageUrl: "https://placehold.co/500x300/8B5CF6/FFFFFF?text=BizPilot+AI"
  };

  const teamMembers = [
    {
      name: "Mohammad Sium",
      role: "CSE, BUET",
      email: "mdsium2004@gmail.com",
      avatar: "/sium.jpg",
      githubUrl: "https://github.com/MdSium003",
      facebookUrl: "https://www.facebook.com/Md.Sium.0003",
      description: ""
    },
    {
      name: "Priyanjan Das Anabil",
      role: "CSE, BUET",
      email: "anabil.das2003@gmail.com",
      avatar: "/anabil.jpg",
      githubUrl: "https://github.com/Anabil-19",
      facebookUrl: "https://www.facebook.com/priyanjan.dasanabil.5",
      description: ""
    },
    {
      name: "Rafsan Jani",
      role: "CSE, BUET",
      email: "irafsan2020@gmail.com",
      avatar: "rafsan.jpg",
      githubUrl: "https://github.com/RJBISLAM",
      facebookUrl: "https://www.facebook.com/rafsanjbi",
      description: ""
    }
  ];

  const features = [
    { 
      title: "Business Idea Generation", 
      description: "Turn vague concepts into structured business models with AI-powered insights.",
      icon: "💡"
    },
    { 
      title: "Roadmap Creation", 
      description: "Get step-by-step strategic plans for execution and milestone tracking.",
      icon: "🗺️"
    },
    { 
      title: "Market Simulation", 
      description: "Test your ideas with simple AI-driven forecasting and market analysis.",
      icon: "📊"
    },
    { 
      title: "Financial Projection", 
      description: "Estimate revenues, costs, and breakeven points with accurate modeling.",
      icon: "💰"
    },
    { 
      title: "Collaboration Tools", 
      description: "Work with your team to refine and validate ideas in real-time.",
      icon: "👥"
    },
    { 
      title: "Guided Templates", 
      description: "Use proven frameworks like Business Model Canvas for structure.",
      icon: "📋"
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'grid', alignContent: 'start' }}>
      <main className="bg-float" style={{ flex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>

        {/* Hero Section */}
        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--foreground)' }}>
            {aboutData.title}
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--muted-foreground)', 
            maxWidth: '800px', 
            margin: '0 auto', 
            lineHeight: '1.6'
          }}>
            {aboutData.content}
          </p>
        </div>

        {/* Mission, Vision, Values Section */}
        <div style={{ padding: '2rem 0' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '2rem', 
            alignItems: 'center' 
          }}>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ 
                      background: 'color-mix(in oklab, var(--primary) 20%, transparent)', 
                      padding: '0.75rem', 
                      borderRadius: '12px' 
                    }}>
                      <Target style={{ color: 'var(--primary)', width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                        Mission
                      </h3>
                      <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                        {aboutData.mission}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ 
                      background: 'color-mix(in oklab, #10B981 20%, transparent)', 
                      padding: '0.75rem', 
                      borderRadius: '12px' 
                    }}>
                      <Eye style={{ color: '#10B981', width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                        Vision
                      </h3>
                      <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                        {aboutData.vision}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ 
                      background: 'color-mix(in oklab, #F59E0B 20%, transparent)', 
                      padding: '0.75rem', 
                      borderRadius: '12px' 
                    }}>
                      <Heart style={{ color: '#F59E0B', width: '24px', height: '24px' }} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 'bold', fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                        Values
                      </h3>
                      <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.6' }}>
                        {aboutData.values}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '1rem' }}>
              <img 
                src="/logo.png" 
                alt="BizPilot Logo"
                style={{ 
                  width: 'clamp(200px, 25vw, 300px)', 
                  height: 'auto', 
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))'
                }}
              />
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ padding: '2rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 'bold', marginBottom: '0.8rem', color: 'var(--foreground)' }}>
              Our Features
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--muted-foreground)', 
              maxWidth: '600px', 
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              Powerful tools designed to help you build and grow your business
            </p>
          </div>
          
          <div className="features">
            {features.map((feature, index) => (
              <div key={index} className="feature">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  marginBottom: '0.75rem', 
                  color: 'var(--foreground)'
                }}>
                  {feature.title}
                </h3>
                <p style={{ color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div style={{ padding: '2rem 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 'bold', marginBottom: '0.8rem', color: 'var(--foreground)' }}>
              Meet Our Team
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--muted-foreground)', 
              maxWidth: '600px', 
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              The dedicated team behind BizPilot, bringing together expertise in technology and business innovation.
            </p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {teamMembers.map((member, index) => (
              <DeveloperCard key={index} {...member} />
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ padding: '2rem 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 80%, #0066cc))',
            color: 'var(--primary-foreground)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            textAlign: 'center'
          }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 'bold', marginBottom: '0.8rem' }}>
              Ready to Get Started?
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              marginBottom: '1.5rem', 
              opacity: 0.9, 
              maxWidth: '600px', 
              margin: '0 auto 1.5rem auto',
              lineHeight: '1.6'
            }}>
              Join thousands of entrepreneurs who trust BizPilot to turn their ideas into successful businesses.
            </p>
            <div style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth < 640 ? 'column' : 'row', 
              gap: '0.8rem', 
              justifyContent: 'center' 
            }}>
              <a 
                href="/register" 
                style={{
                  background: 'var(--primary-foreground)',
                  color: 'var(--primary)',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                  display: 'inline-block'
                }}
              >
                Get Started Free
              </a>
              <a 
                href="/contact" 
                style={{
                  border: '2px solid var(--primary-foreground)',
                  color: 'var(--primary-foreground)',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  transition: 'all 200ms ease',
                  display: 'inline-block'
                }}
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>

        </div>
      </main>
    </div>
  );
}