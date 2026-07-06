import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './hooks/useAuth'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import QuotePage from './pages/QuotePage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore()
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function App() {
  // Prevent browser from opening/navigating when files are dropped anywhere
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault()
    }
    document.addEventListener('dragover', prevent)
    document.addEventListener('drop', prevent)
    return () => {
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', prevent)
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="quote" element={<QuotePage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
      
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
