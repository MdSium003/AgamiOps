import './App.css'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ChatAssistant from './components/ChatAssistant.jsx'
import HomePage from './pages/HomePage.jsx'
import { Outlet } from 'react-router-dom'

function App() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Header />
      <div style={{ paddingTop: 0 }}>
        {/* Home renders for "/"; nested routes render via Outlet */}
        <Outlet />
      </div>
      <Footer />
      <ChatAssistant />
    </div>
  )
}

export default App
