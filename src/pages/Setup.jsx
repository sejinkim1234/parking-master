import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { MapPin, Navigation, Save } from 'lucide-react'
import { getCurrentPosition } from '../utils/geolocation'

export default function Setup() {
  const [isLocating, setIsLocating] = useState(false)
  const homeLocation = useStore(state => state.homeLocation)
  const setHomeLocation = useStore(state => state.setHomeLocation)
  const floorCount = useStore(state => state.floorCount)
  const setFloorCount = useStore(state => state.setFloorCount)
  const navigate = useNavigate()

  const handleGetLocation = async () => {
    setIsLocating(true)
    try {
      const pos = await getCurrentPosition()
      setHomeLocation({ lat: pos.lat, lng: pos.lng, address: '우리집 (GPS 좌표 저장됨)' })
      alert('집 위치가 등록되었습니다. (반경 200m 이내 접근 시 자동 인식)')
    } catch (error) {
      alert('위치 권한을 허용해주세요: ' + error.message)
    } finally {
      setIsLocating(false)
    }
  }

  const handleSave = () => {
    if (!homeLocation) {
      if (!confirm('집 주소가 등록되지 않았습니다. 그래도 계속하시겠습니까? (자동 모드 전환이 작동하지 않습니다)')) {
        return
      }
    }
    navigate('/home')
  }

  return (
    <div className="card">
      <h2><Settings size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }}/>환경 설정</h2>
      
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>우리 집 위치 등록 (지오펜싱)</label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleGetLocation} disabled={isLocating} style={{ flex: 1, minHeight: '55px' }}>
            <MapPin size={20} />
            {isLocating ? '위치 찾는 중...' : '현재 위치를 집으로 등록'}
          </button>
        </div>
        {homeLocation && (
          <p style={{ color: 'var(--accent-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            ✓ {homeLocation.address}
          </p>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>주차장 지하 층수 설정 (최대 B6)</label>
        <select 
          value={floorCount} 
          onChange={(e) => setFloorCount(Number(e.target.value))}
        >
          {[1,2,3,4,5,6].map(num => (
            <option key={num} value={num}>지하 {num}층까지 있음</option>
          ))}
        </select>
      </div>

      <button className="primary" onClick={handleSave} style={{ marginTop: '2rem' }}>
        <Save size={20} /> 설정 저장 및 시작
      </button>
    </div>
  )
}

// Inline import for Settings icon since it was missed in the top imports
import { Settings } from 'lucide-react'
