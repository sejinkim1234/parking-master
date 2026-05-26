import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Setup from './pages/Setup'
import HomeMode from './pages/HomeMode'
import ExternalMode from './pages/ExternalMode'
import MainLayout from './components/MainLayout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="setup" element={<Setup />} />
          <Route path="home" element={<HomeMode />} />
          <Route path="external" element={<ExternalMode />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
