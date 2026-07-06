import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import QuotePage from './pages/QuotePage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import LoadingScreen from './components/LoadingScreen'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) return <LoadingScreen />
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="quote" element={<QuotePage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>
      
      {/* Protected admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <Layout admin>
            <AdminPage />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
