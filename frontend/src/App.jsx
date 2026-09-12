import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import { LoginModal, RegisterModal } from './components/AuthModals'
import { Leaf } from 'lucide-react'

function AppInner() {
  const { profile, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const handleAuthSuccess = (userProfile, defaultTab) => {
    if (defaultTab) {
      setActiveTab(defaultTab)
    } else if (userProfile?.role === 'ngo') {
      setActiveTab('listings')
    } else {
      setActiveTab('overview')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBF9]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0D3B2E] flex items-center justify-center text-white mx-auto shadow-lg animate-pulse">
            <Leaf size={28} className="text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#0D3B2E] tracking-tight">Plateline</h3>
            <p className="text-xs text-slate-500 mt-0.5">Initializing surplus dispatch network...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 selection:bg-[#0D3B2E] selection:text-white">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3500,
          style: {
            borderRadius: '16px',
            background: '#0D3B2E',
            color: '#fff',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 30px -5px rgba(13, 59, 46, 0.25)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
        }} 
      />

      <Navbar
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
        currentView={activeTab}
        onTabChange={setActiveTab}
      />

      {profile ? (
        <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <LandingPage 
          onGetStarted={() => setShowRegister(true)} 
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
      
      {showRegister && (
        <RegisterModal 
          onClose={() => setShowRegister(false)} 
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  )
}
