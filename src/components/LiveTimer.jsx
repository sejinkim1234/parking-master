import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Clock } from 'lucide-react'

export default function LiveTimer() {
  const parkingInfo = useStore(state => state.parkingInfo)
  const [elapsed, setElapsed] = useState({ hours: 0, minutes: 0, isOvertime: false })

  useEffect(() => {
    if (!parkingInfo) return

    const calculateTime = () => {
      const diff = Date.now() - parkingInfo.timestamp
      const totalMinutes = Math.floor(diff / 1000 / 60)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      
      setElapsed({
        hours,
        minutes,
        isOvertime: totalMinutes >= 120
      })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [parkingInfo])

  const handleShowLocation = () => {
    if (parkingInfo) {
      alert(`📍 내 차 위치: ${parkingInfo.location}\n📝 메모: ${parkingInfo.memo || '없음'}`)
    }
  }

  if (!parkingInfo) return null

  return (
    <div 
      onClick={handleShowLocation}
      style={{
        position: 'fixed',
        bottom: '1rem',
        left: '1rem',
        right: '1rem',
        backgroundColor: 'var(--surface-color)',
        padding: '1rem',
        borderRadius: 'var(--border-radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: 'var(--glass-shadow)',
        border: elapsed.isOvertime ? '2px solid var(--danger-color)' : '1px solid var(--surface-active)',
        zIndex: 1000,
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Clock color={elapsed.isOvertime ? 'var(--danger-color)' : 'var(--text-primary)'} />
      <span style={{ 
        color: elapsed.isOvertime ? 'var(--danger-color)' : 'var(--text-primary)',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        현재 {elapsed.hours > 0 ? `${elapsed.hours}시간 ` : ''}{elapsed.minutes}분째 주차 중
      </span>
    </div>
  )
}
