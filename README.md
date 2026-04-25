<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=4a7c59&height=250&section=header&text=AgamiOps&fontSize=70&fontAlignY=35&animation=twinkling&fontColor=ffffff" />
  
  <h1>🚀 AgamiOps: Marking the Future</h1>
  
  <p align="center">
    <a href="https://readme-typing-svg.herokuapp.com">
      <img src="https://readme-typing-svg.herokuapp.com/?lines=Accelerate+your+startup+journey;AI-powered+business+models;Investor-ready+forecasts;Smart+execution+playbooks&font=Inter&center=true&width=500&height=50&color=4a7c59&vCenter=true" alt="Typing SVG animation" />
    </a>
  </p>

  <p>
    <b>Turn ideas into investor-ready plans in minutes. No spreadsheets required.</b>
  </p>
  
  <p>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" /></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /></a>
    <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" /></a>
    <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=black" /></a>
    <a href="https://openrouter.ai"><img src="https://img.shields.io/badge/OpenRouter_AI-121212?style=for-the-badge" /></a>
  </p>
</div>

---

## ✨ Features That Will WOW You

- 🧠 **AI Business Generator:** Tell us your idea, and our AI (via OpenRouter) crafts complete business models, target audiences, and marketing plans.
- 📈 **Financial Crystal Ball:** Auto-generated revenue targets, cost analyses, and break-even points, visualized with interactive, beautiful charts! 
- ✅ **Execution Playbook:** Turn your plan into actionable, gamified, and tracked checklists (My Business).
- 🗣️ **Conversational AI:** A friendly voice-enabled chatbot assistant to help refine your strategies on the fly!
- 🔐 **Secure & Seamless Auth:** Login magically with Google, LinkedIn, or Email using our smooth onboarding flow.

## 🛠 Tech Stack

| Technology      | Component | Feeling |
| :---            | :----     | :--- |
| **Vite + React**| Frontend  | ⚡ Blazing fast |
| **Tailwind CSS**| Styling   | 🎨 Crisp & Responsive |
| **Node + Express**| Backend | 🧱 Rock solid |
| **Neon Postgres** | Database| 💾 Serverless & sleek |
| **OpenRouter**  | AI Brain  | 💡 Extremely smart |

## 🚀 Getting Started

Are you ready to build the future? Let's go!

### 1️⃣ Prerequisites

- **Node.js** (v18+)
- **PostgreSQL** Database (Neon recommended)
- **OpenRouter API Key**

### 2️⃣ Environment Variables

Create a magical `.env` file in the `backend/` folder:

```env
# 🐘 Database Configuration
DATABASE_URL=postgres://user:password@host:port/db
DATABASE_SSL=true

# 🔐 Security
SESSION_SECRET=a_super_secret_string

# ✉️ Email Magic
EMAIL_USER=you@example.com
EMAIL_PASS=your_app_password

# 🌐 API Links
FRONTEND_ORIGIN=http://localhost:5173
PORT=5050

# 🤖 AI Brains (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxxx
OPENROUTER_MODEL=z-ai/glm-4.5-air:free

# 🗝 OAuth Apps
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5050/auth/google/callback

LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_CALLBACK_URL=http://localhost:5050/auth/linkedin/callback
```

### 3️⃣ Installation

Grab a coffee ☕ and run these commands to install all dependencies:

```bash
# Setup the brain (Backend)
npm install --prefix backend

# Setup the looks (Frontend)
npm install --prefix frontend
```

### 4️⃣ Vroom Vroom (Development)

Start the engines for local development:

```bash
# Terminal 1: Wake up the backend (Runs on :5050)
npm run dev --prefix backend

# Terminal 2: Wake up the frontend (Runs on :5173)
npm run dev --prefix frontend
```
*Your frontend will expect the backend to be eagerly listening at `http://localhost:5050`.*

---

## ☁️ Deployment Guide

Ready to show the world? This stack thrives in the cloud:

- **Frontend:** Perfect for **Vercel**. Set `VITE_API_URL` to point to your live backend. Includes a custom `vercel.json` for smooth React SPA routing.
- **Backend:** Loves **Render** Web Services. Pass it your trusty `.env` variables (ensure `NODE_ENV=production` is set for cross-origin cookie magic).
- **Database:** Hosted elegantly on **Neon**.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/starship`.
3. Commit your changes with clear messages.
4. Open a pull request describing the magic you added!

---

<div align="center">
  <h3>Built with ❤️ by the AgamiOps Team</h3>
  <p>Md. Sium • Tahmid Khan • Niloy Faiaz • Rafsan Jani</p>
  <img src="https://img.shields.io/badge/Status-Marking_The_Future-4a7c59?style=flat-square" />
</div>
