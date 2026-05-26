import { useState } from 'react'
import { useStore } from '../store'
import { shareParkingInfo } from '../utils/share'
import { Mic, Share2, MapPin } from 'lucide-react'

export default function HomeMode() {
  const floorRange = useStore(state => state.floorRange) || { min: -3, max: -1 }
  const subZones = useStore(state => state.subZones) || ['위', '아래']
  const parkingInfo = useStore(state => state.parkingInfo)
  const setParkingInfo = useStore(state => state.setParkingInfo)
  const [isRecording, setIsRecording] = useState(false)
  
  // Create floors array from max to min (top to bottom), excluding 0
  const floors = []
  for (let i = floorRange.max; i >= floorRange.min; i--) {
    if (i !== 0) floors.push(i)
  }

  const formatFloor = (num) => num < 0 ? `B${Math.abs(num)}` : `${num}F`

  const handleSaveLocation = (floorNum, zone) => {
    const locationStr = `${formatFloor(floorNum)} ${zone}`
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
      
      // Parse floor
      let detectedFloor = null
      const bMatch = transcript.match(/지하\s*(\d+)층/)
      const fMatch = transcript.match(/지상\s*(\d+)층/) || transcript.match(/(\d+)층/)
      
      if (bMatch) {
        detectedFloor = -Math.abs(parseInt(bMatch[1]))
      } else if (fMatch && !transcript.includes('지하')) {
        detectedFloor = Math.abs(parseInt(fMatch[1]))
      }

      // Parse subzone
      let detectedZone = null
      for (const z of subZones) {
        if (transcript.includes(z)) {
          detectedZone = z
          break
        }
      }
      
      if (detectedFloor !== null) {
        // clamp floor
        if (detectedFloor < floorRange.min) detectedFloor = floorRange.min
        if (detectedFloor > floorRange.max) detectedFloor = floorRange.max
        if (detectedFloor === 0) detectedFloor = 1 // fallback if 0

        handleSaveLocation(detectedFloor, detectedZone || subZones[0])
      } else {
        alert(`인식된 음성: "${transcript}"\n정확한 층수(예: 지하 3층 ${subZones[0]})를 말씀해주세요.`)
      }
    }
    
    recognition.start()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {parkingInfo && parkingInfo.mode === 'home' && (
        <div className="card" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
          <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} /> 저장된 위치: {parkingInfo.location}
          </h2>
          <button style={{ backgroundColor: '#000', color: 'var(--accent-color)', marginTop: '0.5rem' }} onClick={() => shareParkingInfo(parkingInfo)}>
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
              <div style={{ width: '50px', fontSize: '1.2rem', fontWeight: 'bold' }}>{formatFloor(floor)}</div>
              <div style={{ display: 'flex', flex: 1, gap: '0.5rem', flexWrap: 'wrap' }}>
                {subZones.map(zone => {
                  const locationStr = `${formatFloor(floor)} ${zone}`
                  const isSelected = parkingInfo?.location === locationStr
                  return (
                    <button 
                      key={zone}
                      className={isSelected ? 'primary' : ''}
                      onClick={() => handleSaveLocation(floor, zone)}
                      style={{ flex: 1, minWidth: '80px' }}
                    >
                      {zone}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
