# BizPilot 🚀

**AI-Powered Business Model Generator & Execution Platform**

*Developed for BUP CSE TECH CARNIVAL 2025 Hackathon*

---

## 🎯 Project Overview

BizPilot is an intelligent business planning platform that leverages AI to generate comprehensive business models and execution roadmaps. Built for entrepreneurs, startups, and business innovators, it transforms ideas into actionable business strategies with AI-powered insights and collaborative features.

## ✨ Key Features

### 🤖 AI-Powered Business Model Generation
- **Smart Model Creation**: Generate detailed business models using Google's Gemini AI
- **Financial Projections**: Automated 3-month and 24-month financial forecasts
- **Market Analysis**: AI-driven market insights and competitive analysis
- **Voice-Enabled Chat**: Interactive AI assistant with voice input capabilities

### 📋 Execution Management
- **Task-Based Roadmaps**: Break down business models into actionable checklists
- **Progress Tracking**: Visual progress indicators and milestone management
- **Export Capabilities**: Download plans as CSV, PNG, or ZIP files

### 🤝 Collaboration & Sharing
- **Project Sharing**: Share business ideas with the community
- **Marketplace**: Discover and collaborate on innovative business concepts
- **Team Collaboration**: Request and manage collaboration requests
- **Public Showcase**: Showcase your business ideas to potential partners

### 🔐 Secure Authentication
- **Multi-Provider Login**: Google, LinkedIn OAuth integration
- **Email Verification**: Secure account verification system
- **Profile Management**: Comprehensive user profile system

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with modern hooks and functional components
- **Vite** for fast development and building
- **React Router DOM** for client-side routing
- **Tailwind CSS** for responsive design
- **Lucide React** for modern iconography
- **Chart.js** for financial data visualization
- **React Query** for efficient data fetching

### Backend Stack
- **Node.js** with Express.js framework
- **PostgreSQL** database with Neon serverless hosting
- **Passport.js** for authentication strategies
- **Google Generative AI** (Gemini) integration
- **Nodemailer** for email verification
- **Bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

### Database Schema
- **Users**: Authentication, profiles, and verification status
- **Plans**: Business model storage and metadata
- **Shares**: Public project sharing system
- **Collaborators**: Team collaboration management

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (Neon recommended)
- Gmail account for email verification
- Google Cloud API key for Gemini AI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BizPilot
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Configure your .env file with database and API keys
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:5050`

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require

# Server
PORT=5050
SESSION_SECRET=your-secret-key

# AI Integration
GOOGLE_API_KEY=your-gemini-api-key
GOOGLE_MODEL=gemini-pro

# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# CORS
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5050
```

## 📱 User Journey

1. **Registration**: Users sign up with email and verify their account
2. **Onboarding**: Complete profile setup with business role and password
3. **Business Planning**: Generate AI-powered business models
4. **Execution**: Follow step-by-step checklists and track progress
5. **Collaboration**: Share projects and collaborate with others
6. **Marketplace**: Discover and contribute to the business community

## 🎨 Design Philosophy

- **Clean & Modern**: Dull green and cream white color scheme
- **Responsive**: Mobile-first design approach
- **Accessible**: WCAG compliant interface
- **Intuitive**: User-friendly navigation and interactions
- **Professional**: Enterprise-grade UI/UX

## 🔒 Security Features

- **Email Verification**: Mandatory email confirmation
- **Secure Authentication**: OAuth and local strategy support
- **Password Protection**: Bcrypt hashing with salt
- **CORS Protection**: Configured cross-origin policies
- **Session Management**: Secure session handling

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `GET /auth/verify-email` - Email verification
- `POST /auth/resend-verification` - Resend verification email

### Business Models
- `POST /ai/business-models` - Generate AI business models
- `GET /plans` - Get user's business plans
- `POST /plans` - Save business plan
- `PUT /plans/:id` - Update business plan

### Sharing & Collaboration
- `GET /shares` - Get shared projects
- `POST /shares` - Share a project
- `GET /share/:id` - Get specific shared project
- `POST /collaborate` - Request collaboration
- `GET /collaborators/:share_id` - Get collaborators

## 🏆 Hackathon Achievement

**BUP CSE TECH CARNIVAL 2025**

This project was developed as part of the Bangladesh University of Professionals (BUP) Computer Science and Engineering Tech Carnival 2025 hackathon. The platform demonstrates innovative use of AI in business planning and showcases modern web development practices.

## 🤝 Contributing

This is a hackathon project, but contributions and improvements are welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is developed for educational and hackathon purposes. Please respect the intellectual property and use responsibly.

## 👥 Team

Developed by the BizPilot team for BUP CSE TECH CARNIVAL 2025.

## 🔮 Future Enhancements

- **Advanced Analytics**: Business performance tracking
- **Team Workspaces**: Multi-user collaboration spaces
- **API Integration**: Third-party service connections
- **Mobile App**: Native mobile application
- **AI Fine-tuning**: Custom AI model training
- **Enterprise Features**: Advanced security and compliance

---

**Built with ❤️ for entrepreneurs and business innovators**

*Transforming ideas into successful businesses through AI-powered planning and execution.*