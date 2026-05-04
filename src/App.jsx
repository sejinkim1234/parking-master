import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store'
import Login from './pages/Login'
import Setup from './pages/Setup'
import HomeMode from './pages/HomeMode'
import ExternalMode from './pages/ExternalMode'
import MainLayout from './components/MainLayout'

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const user = useStore(state => state.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="setup" element={<Setup />} />
          <Route path="home" element={<HomeMode />} />
          <Route path="external" element={<ExternalMode />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
