import { useState, useRef } from 'react'
import { useStore } from '../store'
import { shareParkingInfo } from '../utils/share'
import { Mic, Share2, MapPin } from 'lucide-react'

export default function HomeMode() {
  const floorCount = useStore(state => state.floorCount)
  const parkingInfo = useStore(state => state.parkingInfo)
  const setParkingInfo = useStore(state => state.setParkingInfo)
  const [isRecording, setIsRecording] = useState(false)
  
  // Create array from 1 to floorCount
  const floors = Array.from({ length: floorCount }, (_, i) => i + 1)

  const handleSaveLocation = (floor, position) => {
    const locationStr = `B${floor} ${position}`
    setParkingInfo({
      mode: 'home',
      location: locationStr,
      memo: ''
    })
  }

  const handleVoiceRecord = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = false
    
    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      // Parse transcript, e.g., "지하 3층 아래"
      const floorMatch = transcript.match(/(\d+)층/)
      const positionMatch = transcript.includes('아래') ? '아래' : (transcript.includes('위') ? '위' : '')
      
      if (floorMatch) {
        const f = Math.min(parseInt(floorMatch[1]), floorCount)
        const p = positionMatch || '위'
        handleSaveLocation(f, p)
      } else {
        alert(`인식된 음성: "${transcript}"\n정확한 층수(예: 지하 3층 위)를 말씀해주세요.`)
      }
    }
    
    recognition.start()
  }

  const handleShare = () => {
    if (parkingInfo) {
      shareParkingInfo(parkingInfo)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {parkingInfo && parkingInfo.mode === 'home' && (
        <div className="card" style={{ backgroundColor: 'var(--accent-color)', color: '#000' }}>
          <h2 style={{ color: '#000', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} /> 저장된 위치: {parkingInfo.location}
          </h2>
          <button style={{ backgroundColor: '#000', color: 'var(--accent-color)', marginTop: '0.5rem' }} onClick={handleShare}>
            <Share2 size={20} /> 카카오톡 공유
          </button>
        </div>
      )}

      <div className="card">
        <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          층별 선택
          <button 
            onClick={handleVoiceRecord}
            style={{ 
              width: 'auto', 
              padding: '0.5rem 1rem', 
              backgroundColor: isRecording ? 'var(--danger-color)' : 'var(--surface-active)',
              color: isRecording ? '#fff' : 'var(--text-primary)'
            }}
          >
            <Mic size={20} /> {isRecording ? '듣는 중...' : '음성 입력'}
          </button>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {floors.map(floor => (
            <div key={floor} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', fontSize: '1.2rem', fontWeight: 'bold' }}>B{floor}</div>
              <div style={{ display: 'flex', flex: 1, gap: '0.5rem' }}>
                <button 
                  className={parkingInfo?.location === `B${floor} 위` ? 'primary' : ''}
                  onClick={() => handleSaveLocation(floor, '위')}
                  style={{ flex: 1 }}
                >
                  위 (Upper)
                </button>
                <button 
                  className={parkingInfo?.location === `B${floor} 아래` ? 'primary' : ''}
                  onClick={() => handleSaveLocation(floor, '아래')}
                  style={{ flex: 1 }}
                >
                  아래 (Lower)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
