import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import NotFound from './pages/NotFound.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SelectedPlan from './pages/SelectedPlan.jsx'
import ChecklistsPage from './pages/ChecklistsPage.jsx'
import AboutPage from './pages/AboutPage.jsx'
import MarketplacePage from './pages/MarketplacePage.jsx'
import ShareDetailPage from './pages/ShareDetailPage.jsx'

import VerifyEmailPage from './pages/VerifyEmailPage.jsx'

import BusinessPage from './pages/BusinessPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import InventoryAIAnalysisPage from './pages/InventoryAIAnalysisPage.jsx'


function RouteError() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div className="card">
        <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
        <p>Please try again.</p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'plan', element: <SelectedPlan /> },
      { path: 'checklists', element: <ChecklistsPage /> },
      { path: 'business', element: <BusinessPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/ai-analysis', element: <InventoryAIAnalysisPage /> },
      { path: 'marketplace', element: <MarketplacePage /> },
      { path: 'share/:id', element: <ShareDetailPage /> },
      { path: 'about-us', element: <AboutPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: '*', element: <NotFound /> },
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
