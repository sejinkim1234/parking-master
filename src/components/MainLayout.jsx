import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Car, Settings, LogOut, MapPin, Home } from 'lucide-react'
import { useStore } from '../store'
import LiveTimer from './LiveTimer'
import { useEffect } from 'react'
import { checkGeofence } from '../utils/geolocation'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useStore(state => state.logout)
  const user = useStore(state => state.user)
  const homeLocation = useStore(state => state.homeLocation)
  const setCurrentMode = useStore(state => state.setCurrentMode)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Geofencing Check on Load
  useEffect(() => {
    if (homeLocation) {
      checkGeofence(homeLocation).then(isHome => {
        const newMode = isHome ? 'home' : 'external'
        setCurrentMode(newMode)
        // Auto navigate if not in setup
        if (location.pathname !== '/setup') {
          navigate(isHome ? '/home' : '/external')
        }
      })
    }
  }, [homeLocation, navigate, setCurrentMode, location.pathname])

  return (
    <div className="container" style={{ padding: 0 }}>
      <header className="nav-header">
        <h1>{user?.carNumber} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>주차 마스터</span></h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ minHeight: '40px', padding: '0.2rem 0.5rem', width: 'auto' }} onClick={() => navigate('/setup')}>
            <Settings size={20} />
          </button>
          <button style={{ minHeight: '40px', padding: '0.2rem 0.5rem', width: 'auto', border: '1px solid var(--danger-color)', color: 'var(--danger-color)' }} onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </header>
      
      {/* Mode Switcher */}
      {location.pathname !== '/setup' && (
        <div style={{ display: 'flex', padding: '1rem', gap: '0.5rem', backgroundColor: 'var(--surface-color)' }}>
          <button 
            className={location.pathname === '/home' ? 'primary' : ''}
            onClick={() => navigate('/home')}
          >
            <Home size={20} /> 집 모드
          </button>
          <button 
            className={location.pathname === '/external' ? 'primary' : ''}
            onClick={() => navigate('/external')}
          >
            <MapPin size={20} /> 외부 모드
          </button>
        </div>
      )}

      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>

      <LiveTimer />
    </div>
  )
}
