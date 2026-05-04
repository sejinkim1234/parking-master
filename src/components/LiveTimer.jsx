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

  if (!parkingInfo) return null

  return (
    <div style={{
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
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      border: elapsed.isOvertime ? '2px solid var(--danger-color)' : '1px solid var(--surface-active)',
      zIndex: 1000
    }}>
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
