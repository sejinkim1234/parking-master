import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Car, Settings, MapPin, Home } from 'lucide-react'
import { useStore } from '../store'
import LiveTimer from './LiveTimer'
import { useEffect, useState } from 'react'
import { checkGeofence } from '../utils/geolocation'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useStore(state => state.user)
  const homeLocation = useStore(state => state.homeLocation)
  const setCurrentMode = useStore(state => state.setCurrentMode)
  const useGpsTracking = useStore(state => state.useGpsTracking)
  const setUseGpsTracking = useStore(state => state.setUseGpsTracking)
  
  const [hasCheckedGeo, setHasCheckedGeo] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  // Geofencing Check on Load ONLY ONCE
  useEffect(() => {
    if (homeLocation && !hasCheckedGeo) {
      if (useGpsTracking === 'prompt') {
        setShowPrompt(true)
      } else if (useGpsTracking === 'always') {
        checkGeofence(homeLocation).then(isHome => {
          const newMode = isHome ? 'home' : 'external'
          setCurrentMode(newMode)
          setHasCheckedGeo(true) // Prevent future auto-redirects
          navigate(isHome ? '/home' : '/external', { replace: true })
        }).catch(err => {
          console.error("Geofence error:", err)
          setHasCheckedGeo(true)
        })
      } else if (useGpsTracking === 'never') {
        setHasCheckedGeo(true) // Bypass and stay on current/default mode
      }
    }
  }, [homeLocation, hasCheckedGeo, useGpsTracking, navigate, setCurrentMode])

  const handleAllowGps = () => {
    setUseGpsTracking('always')
    setShowPrompt(false)
  }

  const handleDenyGps = () => {
    setUseGpsTracking('never')
    setShowPrompt(false)
    setHasCheckedGeo(true)
  }

  return (
    <div className="container" style={{ padding: 0 }}>
      {showPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)' }}>
              <MapPin size={24} /> GPS 자동 감지 설정
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              앱을 실행할 때 GPS 정보를 받아 <strong>우리집</strong>과 <strong>외부 주차장</strong> 화면 중 알맞은 곳을 자동으로 띄워드릴까요?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              * 거부하시면 매번 위치 권한을 묻지 않으며, 수동으로 화면을 선택해서 사용하실 수 있습니다. (설정에서 변경 가능)
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
              <button onClick={handleDenyGps} style={{ flex: 1 }}>
                거부 (수동 선택)
              </button>
              <button className="primary" onClick={handleAllowGps} style={{ flex: 1.2 }}>
                동의 (자동 감지)
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="nav-header">
        <h1>{user?.carNumber || '내 차'} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>차어디</span></h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{ minHeight: '40px', padding: '0.2rem 0.5rem', width: 'auto' }} onClick={() => navigate('/setup')}>
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      {/* Mode Switcher */}
      {location.pathname !== '/setup' && (
        <div style={{ display: 'flex', padding: '1rem', gap: '0.5rem', backgroundColor: 'var(--surface-color)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <button 
            className={location.pathname === '/home' ? 'primary' : ''}
            onClick={() => navigate('/home')}
          >
            <Home size={20} /> 우리집
          </button>
          <button 
            className={location.pathname === '/external' ? 'primary' : ''}
            onClick={() => navigate('/external')}
          >
            <MapPin size={20} /> 외부 주차장
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
