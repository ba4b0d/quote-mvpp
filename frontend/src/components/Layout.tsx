import { Outlet, Link, useLocation } from 'react-router-dom'
import { Home, Calculator, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const navItems = [
    { path: '/', label: 'خانه', icon: Home },
    { path: '/quote', label: 'قیمت‌دهی', icon: Calculator },
  ]
  
  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)]/80 backdrop-blur-lg border-b border-[var(--surface-light)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🏭</span>
              <span className="gradient-text">3DJAT</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 text-sm transition-colors ${
                    location.pathname === item.path
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--surface)] border-t border-[var(--surface-light)]">
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                      : 'hover:bg-[var(--surface-light)]'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      
      <main className="pt-16">
        <Outlet />
      </main>
      
      <footer className="bg-[var(--surface)] border-t border-[var(--surface-light)] py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-[var(--text-secondary)] text-sm">
          <p>© ۲۰۲۶ 3DJAT Quote. ساخته شده با ❤️</p>
        </div>
      </footer>
    </div>
  )
}
