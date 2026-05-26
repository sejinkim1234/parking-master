import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { MapPin, Save, Settings, Plus, X, Search } from 'lucide-react'
import { getCurrentPosition, getCoordinatesFromAddress } from '../utils/geolocation'

export default function Setup() {
  const [isLocating, setIsLocating] = useState(false)
  const [addressSearch, setAddressSearch] = useState('')
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)

  const homeLocation = useStore(state => state.homeLocation)
  const setHomeLocation = useStore(state => state.setHomeLocation)
  const floorRange = useStore(state => state.floorRange)
  const setFloorRange = useStore(state => state.setFloorRange)
  const subZones = useStore(state => state.subZones)
  const setSubZones = useStore(state => state.setSubZones)
  const useGpsTracking = useStore(state => state.useGpsTracking)
  const setUseGpsTracking = useStore(state => state.setUseGpsTracking)
  
  const [newZone, setNewZone] = useState('')
  const navigate = useNavigate()

  const handleGetLocation = async () => {
    setIsLocating(true)
    try {
      const pos = await getCurrentPosition()
      setHomeLocation({ lat: pos.lat, lng: pos.lng, address: '우리집 (GPS 좌표 저장됨)' })
      alert('현재 위치가 집으로 등록되었습니다. (반경 200m 이내 접근 시 자동 인식)')
    } catch (error) {
      alert('위치 권한을 허용해주세요: ' + error.message)
    } finally {
      setIsLocating(false)
    }
  }

  const handleSearchAddress = async () => {
    if (!addressSearch.trim()) return
    setIsSearchingAddress(true)
    try {
      const result = await getCoordinatesFromAddress(addressSearch)
      if (result) {
        setHomeLocation({ lat: result.lat, lng: result.lng, address: result.address })
        alert('검색하신 주소로 집 위치가 등록되었습니다.')
        setAddressSearch('')
      } else {
        alert('주소를 찾을 수 없습니다. 도로명 주소나 동+지번을 정확히 입력해주세요.')
      }
    } catch (error) {
      alert('주소 검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearchingAddress(false)
    }
  }

  const handleAddZone = () => {
    if (newZone.trim() && !subZones.includes(newZone.trim())) {
      if (subZones.length >= 4) {
        alert('세부 구역은 최대 4개까지만 설정할 수 있습니다.')
        return
      }
      setSubZones([...subZones, newZone.trim()])
      setNewZone('')
    }
  }

  const handleRemoveZone = (zoneToRemove) => {
    if (subZones.length <= 1) {
      alert('최소 1개의 세부 구역은 필요합니다.')
      return
    }
    setSubZones(subZones.filter(z => z !== zoneToRemove))
  }

  const handleSave = () => {
    if (!homeLocation) {
      if (!confirm('집 주소가 등록되지 않았습니다. 그래도 계속하시겠습니까? (자동 모드 전환이 작동하지 않습니다)')) {
        return
      }
    }
    navigate('/home')
  }

  const formatFloor = (num) => num < 0 ? `B${Math.abs(num)}` : `${num}F`

  return (
    <div className="card">
      <h2><Settings size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }}/>환경 설정</h2>
      
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label>우리 집 위치 등록 (지오펜싱)</label>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleGetLocation} disabled={isLocating} style={{ flex: 1, minHeight: '55px' }}>
            <MapPin size={20} />
            {isLocating ? '위치 찾는 중...' : 'GPS 현재 위치로 등록'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="예: 도로명 주소 (강남대로 123)" 
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
            />
          </div>
          <button onClick={handleSearchAddress} disabled={isSearchingAddress} style={{ width: 'auto', padding: '0 1.2rem', backgroundColor: 'var(--surface-active)' }}>
            <Search size={20} />
          </button>
        </div>

        {homeLocation && (
          <p style={{ color: 'var(--accent-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            ✓ 저장된 위치: {homeLocation.address}
          </p>
        )}
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>GPS 자동 위치 판별 설정</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.3rem' }}>
          앱이 실행될 때 자동으로 집과 외부 주차장을 판별합니다.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={useGpsTracking === 'always' ? 'primary' : ''} 
            onClick={() => setUseGpsTracking('always')}
            style={{ flex: 1, minHeight: '44px' }}
          >
            자동 감지 (GPS ON)
          </button>
          <button 
            className={useGpsTracking === 'never' ? 'primary' : ''} 
            onClick={() => setUseGpsTracking('never')}
            style={{ flex: 1, minHeight: '44px' }}
          >
            수동 선택 (GPS OFF)
          </button>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>주차장 층수 범위 설정</label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            style={{ flex: 1 }}
            value={floorRange.min} 
            onChange={(e) => setFloorRange({ ...floorRange, min: Number(e.target.value) })}
          >
            {[-6, -5, -4, -3, -2, -1, 1].map(num => (
              <option key={num} value={num}>최하층: {formatFloor(num)}</option>
            ))}
          </select>
          <span>~</span>
          <select 
            style={{ flex: 1 }}
            value={floorRange.max} 
            onChange={(e) => setFloorRange({ ...floorRange, max: Number(e.target.value) })}
          >
            {[-1, 1, 2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>최상층: {formatFloor(num)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label>세부 구역(Sub-zone) 커스텀</label>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.3rem' }}>
          층별로 선택할 구역 태그를 내 맘대로 설정하세요 (최대 4개)
        </p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="새 구역 추가 (예: A구역, 동편...)"
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddZone()}
          />
          <button onClick={handleAddZone} style={{ width: 'auto', padding: '0 1rem' }}>
            <Plus size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {subZones.map(zone => (
            <div key={zone} style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              backgroundColor: 'var(--surface-active)', padding: '0.5rem 1rem', 
              borderRadius: 'var(--border-radius)', fontSize: '0.9rem' 
            }}>
              {zone}
              <X size={16} cursor="pointer" onClick={() => handleRemoveZone(zone)} color="var(--text-secondary)" />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="danger" onClick={() => navigate('/home')} style={{ flex: 1 }}>
          취소 / 뒤로가기
        </button>
        <button className="primary" onClick={handleSave} style={{ flex: 2 }}>
          <Save size={20} /> 설정 저장 및 시작
        </button>
      </div>
    </div>
  )
}
