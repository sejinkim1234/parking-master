import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { shareParkingInfo } from '../utils/share'
import { Camera, MapPin, Share2, Save, Locate, Loader2 } from 'lucide-react'
import { getCurrentPosition, getPOIfromCoordinates } from '../utils/geolocation'
import Tesseract from 'tesseract.js'

// Image preprocessing helper for OCR: Converts to Grayscale & enhances contrast
const preprocessImage = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      const maxDim = 1000
      let width = img.width
      let height = img.height
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      const imgData = ctx.getImageData(0, 0, width, height)
      const data = imgData.data
      
      let totalLuminance = 0
      for (let i = 0; i < data.length; i += 4) {
        totalLuminance += (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2])
      }
      const avgLuminance = totalLuminance / (data.length / 4)
      
      for (let i = 0; i < data.length; i += 4) {
        let gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]
        
        // Enhance contrast based on average luminance
        if (gray > avgLuminance) {
          gray = Math.min(255, gray + (255 - gray) * 0.5)
        } else {
          gray = Math.max(0, gray - gray * 0.5)
        }
        
        data[i] = gray
        data[i+1] = gray
        data[i+2] = gray
      }
      
      ctx.putImageData(imgData, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = (err) => reject(err)
    img.src = imageSrc
  })
}

// Parses recognized text and extracts candidates for parking locations
function parseParkingOcr(text) {
  if (!text) return []
  
  const lines = text.split(/[\n\r]+/)
  const candidates = new Set()
  
  const patterns = [
    /\b\d{3,4}동\b/g,
    /\b[A-Za-z가-힣]{1,2}-\d{1,4}\b/gi,
    /\b[B|F]\d{1,2}-[A-Za-z0-9]+\b/gi,
    /\b[B|F]\d{1,2}[A-Za-z]?\d{0,3}\b/gi,
    /\b[A-Z]\d{1,3}\b/gi,
    /지하\s*\d+층/g,
    /지상\s*\d+층/g,
    /\b\d+층\b/g,
    /\b\d{2,4}\b/g
  ]

  const stopWords = [
    'exit', 'fire', 'extinguisher', '소화기', '비상구', '출구', '입구', '주차', '속도', '금지', 
    '천천히', 'parking', 'speed', 'limit', 'slow', 'warning', '위험', '주의', '차량', '구역',
    '보행자', '통로', '화재', '발생', '경보', '안전', '제한', '시간', '요금', '정산', '카메라'
  ]

  const isStopWord = (word) => {
    const lower = word.toLowerCase()
    return stopWords.some(sw => lower.includes(sw))
  }

  for (const line of lines) {
    for (const pattern of patterns) {
      const matches = line.match(pattern)
      if (matches) {
        for (const match of matches) {
          const clean = match.trim()
          if (clean && clean.length >= 2 && clean.length <= 12 && !isStopWord(clean)) {
            candidates.add(clean)
          }
        }
      }
    }

    const tokens = line.split(/[\s,]+/)
    for (const token of tokens) {
      const clean = token.replace(/[^a-zA-Z0-9가-힣-]/g, '').trim()
      if (clean && clean.length >= 2 && clean.length <= 8) {
        const hasNumber = /\d/.test(clean)
        const isCapitalPillar = /^[A-Z]$/.test(clean)
        const isHangulPillar = /^[가-힣]{1,2}$/.test(clean) && !isStopWord(clean)
        
        if ((hasNumber || isCapitalPillar || isHangulPillar) && !isStopWord(clean)) {
          candidates.add(clean)
        }
      }
    }
  }

  const candidateList = Array.from(candidates)

  const getScore = (item) => {
    let score = 0
    if (/[A-Za-z가-힣]-\d+/.test(item)) score += 50
    if (/\d+동/.test(item)) score += 40
    if (/^[B|F]\d{1,2}-[A-Za-z0-9]+$/i.test(item)) score += 35
    if (/^[B|F]\d+$/i.test(item)) score += 20
    if (/^[A-Z]\d+$/i.test(item)) score += 25
    if (/^\d{3,4}$/.test(item)) score += 15
    if (item.length > 8) score -= 10
    return score
  }

  return candidateList
    .map(item => ({ text: item, score: getScore(item) }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.text)
}

export default function ExternalMode() {
  const parkingInfo = useStore(state => state.parkingInfo)
  const setParkingInfo = useStore(state => state.setParkingInfo)
  
  const [poi, setPoi] = useState('')
  const [isFetchingPoi, setIsFetchingPoi] = useState(false)
  const [pillar, setPillar] = useState('')
  const [memo, setMemo] = useState('')
  const [photo, setPhoto] = useState(null)
  
  const [isScanningOcr, setIsScanningOcr] = useState(false)
  const [ocrStatus, setOcrStatus] = useState('')
  const [ocrCandidates, setOcrCandidates] = useState([])
  
  const fileInputRef = useRef(null)

  // Fetch POI automatically on load
  useEffect(() => {
    let mounted = true;
    const fetchPoi = async () => {
      setIsFetchingPoi(true)
      try {
        const pos = await getCurrentPosition()
        const fetchedPoi = await getPOIfromCoordinates(pos.lat, pos.lng)
        if (mounted && fetchedPoi) {
          setPoi(fetchedPoi)
        }
      } catch (err) {
        console.error("Failed to fetch POI automatically", err)
      } finally {
        if (mounted) setIsFetchingPoi(false)
      }
    }
    fetchPoi()
    return () => { mounted = false }
  }, [])

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        setPhoto(reader.result)
        setOcrCandidates([])
        
        setIsScanningOcr(true)
        setOcrStatus('사진 화질 개선 중...')
        
        try {
          // Preprocess the image to enhance readability
          const processedDataUrl = await preprocessImage(reader.result)
          
          setOcrStatus('사진 속 글씨 분석 중...')
          const result = await Tesseract.recognize(processedDataUrl, 'kor+eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                setOcrStatus(`글씨 분석 중... ${Math.floor(m.progress * 100)}%`)
              }
            }
          })
          
          if (result.data.text) {
            const parsedList = parseParkingOcr(result.data.text)
            setOcrCandidates(parsedList)
            
            if (parsedList.length > 0) {
              setPillar(parsedList[0])
              setOcrStatus('분석 완료!')
            } else {
              const cleanText = result.data.text.replace(/[\n\r]+/g, ' ').trim()
              if (cleanText) {
                const truncatedText = cleanText.substring(0, 20)
                setPillar(truncatedText)
                setOcrStatus('분석 완료! (일치 패턴 없음)')
              } else {
                setOcrStatus('인식된 글씨가 없습니다.')
              }
            }
          } else {
            setOcrStatus('인식된 글씨가 없습니다.')
          }
        } catch (error) {
          console.error("OCR Error:", error)
          setOcrStatus('글씨 인식에 실패했습니다.')
        } finally {
          setTimeout(() => setIsScanningOcr(false), 1500)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (!pillar.trim() && !memo.trim() && !photo && !poi.trim()) {
      alert('저장할 위치 정보나 사진을 입력해주세요.')
      return
    }
    
    let locationStr = ''
    if (poi) locationStr += `[${poi}] `
    locationStr += pillar ? `기둥 ${pillar}` : '외부 주차장'

    setParkingInfo({
      mode: 'external',
      location: locationStr.trim(),
      memo,
      photo
    })
    
    alert('위치 저장 완료')
  }

  const handleQuickTag = (tag) => {
    setMemo(prev => prev ? `${prev}, ${tag}` : tag)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {parkingInfo && parkingInfo.mode === 'external' && (
        <div className="card" style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
          <h2 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={24} /> 저장된 위치: {parkingInfo.location}
          </h2>
          {parkingInfo.memo && <p style={{ marginTop: '0.5rem' }}>메모: {parkingInfo.memo}</p>}
          <button style={{ backgroundColor: '#fff', color: 'var(--accent-color)', marginTop: '0.5rem' }} onClick={() => shareParkingInfo(parkingInfo)}>
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
            border: '1px dashed var(--text-secondary)'
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
        
        {isScanningOcr && (
          <div style={{ color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Loader2 size={16} className="spin" /> {ocrStatus}
          </div>
        )}

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>자동 위치명 (POI)</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder={isFetchingPoi ? "위치 정보 가져오는 중..." : "예: 롯데월드몰, 올림픽공원"} 
              value={poi}
              onChange={(e) => setPoi(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            <Locate 
              size={20} 
              color={isFetchingPoi ? 'var(--text-secondary)' : 'var(--accent-color)'}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>기둥 번호 입력</label>
          <input 
            type="text" 
            placeholder="예: 가-104" 
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
          />
        </div>

        {ocrCandidates.length > 0 && (
          <div className="form-group" style={{ marginTop: '-0.5rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>
              추천 위치 선택 (사진에서 감지됨):
            </label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {ocrCandidates.map((cand, idx) => (
                <button 
                  key={idx} 
                  type="button"
                  onClick={() => setPillar(cand)}
                  style={{ 
                    width: 'auto', 
                    padding: '0.3rem 0.6rem', 
                    minHeight: '35px', 
                    fontSize: '0.85rem',
                    backgroundColor: pillar === cand ? 'var(--accent-color)' : 'var(--surface-active)',
                    color: pillar === cand ? '#fff' : 'var(--text-primary)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  {cand}
                </button>
              ))}
            </div>
          </div>
        )}

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
            placeholder="출입구 쪽, 눈에 띄는 간판 등..."
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
