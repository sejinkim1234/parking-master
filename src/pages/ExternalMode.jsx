import { useState, useRef } from 'react'
import { useStore } from '../store'
import { shareParkingInfo } from '../utils/share'
import { Camera, MapPin, Share2, Save } from 'lucide-react'

export default function ExternalMode() {
  const parkingInfo = useStore(state => state.parkingInfo)
  const setParkingInfo = useStore(state => state.setParkingInfo)
  
  const [pillar, setPillar] = useState('')
  const [memo, setMemo] = useState('')
  const [photo, setPhoto] = useState(null)
  
  const fileInputRef = useRef(null)

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!pillar.trim() && !memo.trim() && !photo) {
      alert('저장할 위치 정보나 사진을 입력해주세요.')
      return
    }
    
    setParkingInfo({
      mode: 'external',
      location: pillar ? `기둥 ${pillar}` : '외부 주차장',
      memo,
      photo
    })
    
    alert('외부 주차 위치가 저장되었습니다.')
  }

  const handleQuickTag = (tag) => {
    setMemo(prev => prev ? `${prev}, ${tag}` : tag)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {parkingInfo && parkingInfo.mode === 'external' && (
        <div className="card" style={{ backgroundColor: 'var(--accent-color)', color: '#000' }}>
          <h2 style={{ color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} /> 저장된 위치: {parkingInfo.location}
          </h2>
          {parkingInfo.memo && <p style={{ marginTop: '0.5rem' }}>메모: {parkingInfo.memo}</p>}
          <button style={{ backgroundColor: '#000', color: 'var(--accent-color)', marginTop: '0.5rem' }} onClick={() => shareParkingInfo(parkingInfo)}>
            <Share2 size={20} /> 카카오톡 공유
          </button>
        </div>
      )}

      <div className="card">
        {/* Camera Button */}
        <div 
          style={{ 
            height: '150px', 
            backgroundColor: photo ? 'transparent' : 'var(--surface-active)',
            backgroundImage: photo ? `url(${photo})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 'var(--border-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px dashed var(--text-secondary)'
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {!photo && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <Camera size={48} />
              <span>여기를 눌러 사진 촬영</span>
            </div>
          )}
        </div>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handlePhotoCapture}
        />

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>기둥 번호 입력</label>
          <input 
            type="number" 
            pattern="\d*"
            placeholder="예: 104" 
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>빠른 태그</label>
          <div className="tag-group">
            <button className="tag-btn" onClick={() => handleQuickTag('엘리베이터 앞')}>엘리베이터 앞</button>
            <button className="tag-btn" onClick={() => handleQuickTag('에스컬레이터 인근')}>에스컬레이터 인근</button>
            <button className="tag-btn" onClick={() => handleQuickTag('출구 방향')}>출구 방향</button>
          </div>
        </div>

        <div className="form-group">
          <label>부가 메모 (특징 기록)</label>
          <textarea 
            rows={3} 
            placeholder="부동산 임장, 방문지 특징 등..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          ></textarea>
        </div>

        <button className="primary" onClick={handleSave} style={{ marginTop: '1rem' }}>
          <Save size={20} /> 위치 저장하기
        </button>
      </div>
    </div>
  )
}
