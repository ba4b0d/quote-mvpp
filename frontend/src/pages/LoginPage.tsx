import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      toast.error('لطفاً نام کاربری و رمز عبور را وارد کنید')
      return
    }
    
    setIsLoading(true)
    
    try {
      const success = await login(username, password)
      
      if (success) {
        toast.success('خوش آمدید!')
        navigate('/admin')
      } else {
        toast.error('نام کاربری یا رمز عبور اشتباه است')
      }
    } catch (error) {
      toast.error('خطا در ورود')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold">ورود کارکنان</h1>
            <p className="text-[var(--text-secondary)] mt-2">
              دسترسی به پنل مدیریت
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                نام کاربری
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری را وارد کنید"
                  className="input pr-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور را وارد کنید"
                  className="input pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="spinner w-5 h-5 border-2" />
                  در حال ورود...
                </>
              ) : (
                'ورود'
              )}
            </button>
          </form>
          
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-[var(--surface-light)] text-center text-sm text-[var(--text-secondary)]">
              <p>اطلاعات ورود پیش‌فرض: admin / admin123</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
