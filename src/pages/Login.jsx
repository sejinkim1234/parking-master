import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Car } from 'lucide-react'

export default function Login() {
  const [carNumber, setCarNumber] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const login = useStore(state => state.login)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!carNumber.trim() || pin.length !== 4) {
      setError('차량번호와 4자리 비밀번호를 정확히 입력해주세요.')
      return
    }
    
    // Cloud DB 연동 시 이곳에 인증 로직 추가
    login(carNumber, pin)
    navigate('/setup') // 처음 로그인 시 설정으로 이동
  }

  return (
    <div className="container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Car size={64} color="var(--accent-color)" />
          <h1 style={{ marginTop: '1rem', fontSize: '1.8rem' }}>차어디</h1>
          <p style={{ color: 'var(--text-secondary)' }}>내 차 위치를 똑똑하게 기억하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="form-group" style={{ gap: '1.5rem' }}>
          <div className="form-group">
            <label>차량번호</label>
            <input 
              type="text" 
              placeholder="예: 12가3456" 
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>비밀번호 (4자리)</label>
            <input 
              type="password" 
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="4"
              placeholder="****" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </div>

          {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className="primary" style={{ marginTop: '1rem' }}>
            시작하기
          </button>
        </form>
      </div>
    </div>
  )
}
