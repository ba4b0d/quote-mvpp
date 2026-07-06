import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../hooks/useAuth'
import { Settings, Package, Users, BarChart3, LogOut, Save } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = '/api/v1'

export default function AdminPage() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('materials')
  const [materials, setMaterials] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [editSettings, setEditSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [materialsRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/materials`),
        axios.get(`${API_URL}/settings`)
      ])
      setMaterials(materialsRes.data)
      setSettings(settingsRes.data)
      setEditSettings(settingsRes.data)
    } catch (error) {
      toast.error('خطا در بارگذاری اطلاعات')
    } finally {
      setIsLoading(false)
    }
  }
  
  const updateEditSetting = (key: string, value: string) => {
    setEditSettings((prev: any) => ({ ...prev, [key]: value }))
  }
  
  const handleSaveSettings = async () => {
    try {
      const settingsToSave = {
        electricity_rate_per_kwh: editSettings.electricity_rate_per_kwh,
        overhead_pct: editSettings.overhead_pct,
        markup_pct: editSettings.markup_pct,
        coloring_cost_per_hour: editSettings.coloring_cost_per_hour,
        default_layer_height: editSettings.default_layer_height,
        default_infill_pct: editSettings.default_infill_pct,
      }
      
      await Promise.all(
        Object.entries(settingsToSave).map(([key, value]) =>
          axios.put(`${API_URL}/settings/${key}`, { value: String(value) })
        )
      )
      setSettings(editSettings)
      toast.success('تنظیمات ذخیره شد!')
    } catch (error) {
      toast.error('خطا در ذخیره تنظیمات')
    }
  }
  
  const tabs = [
    { id: 'materials', label: 'متریال‌ها', icon: Package },
    { id: 'settings', label: 'تنظیمات', icon: Settings },
    { id: 'analytics', label: 'آمار', icon: BarChart3 },
  ]
  
  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      {/* Admin Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--surface-light)] px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">پنل مدیریت</h1>
            <span className="text-sm text-[var(--text-secondary)]">
              خوش آمدید، {user?.username}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="btn-ghost flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </header>
      
      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-black'
                    : 'hover:bg-[var(--surface-light)]'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </aside>
          
          {/* Main Content */}
          <main className="flex-1">
            {activeTab === 'materials' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">متریال‌ها</h2>
                  <button className="btn-secondary text-sm">
                    + افزودن متریال
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="spinner" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-right text-[var(--text-secondary)] text-sm border-b border-[var(--surface-light)]">
                          <th className="pb-3 font-normal">نام</th>
                          <th className="pb-3 font-normal">قیمت/کیلوگرم</th>
                          <th className="pb-3 font-normal">چگالی</th>
                          <th className="pb-3 font-normal">رنگ</th>
                          <th className="pb-3 font-normal">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((mat, index) => (
                          <tr
                            key={index}
                            className="border-b border-[var(--surface-light)] hover:bg-[var(--surface-light)]/50"
                          >
                            <td className="py-3">{mat.name}</td>
                            <td className="py-3">{mat.price_per_kg?.toLocaleString()} تومان</td>
                            <td className="py-3">{mat.density_g_cm3}g/cm³</td>
                            <td className="py-3">{mat.color}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded">
                                فعال
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}
            
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">تنظیمات</h2>
                  <button
                    onClick={handleSaveSettings}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    ذخیره تغییرات
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        نرخ برق (تومان/کیلووات‌ساعت)
                      </label>
                      <input
                        type="number"
                        value={editSettings.electricity_rate_per_kwh || ''}
                        onChange={(e) => updateEditSetting('electricity_rate_per_kwh', e.target.value)}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        هزینه سربار (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editSettings.overhead_pct || ''}
                        onChange={(e) => updateEditSetting('overhead_pct', e.target.value)}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        سود (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editSettings.markup_pct || ''}
                        onChange={(e) => updateEditSetting('markup_pct', e.target.value)}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        هزینه کارگر (تومان/ساعت)
                      </label>
                      <input
                        type="number"
                        value={editSettings.coloring_cost_per_hour || ''}
                        onChange={(e) => updateEditSetting('coloring_cost_per_hour', e.target.value)}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        ارتفاع لایه پیش‌فرض (mm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editSettings.default_layer_height || ''}
                        onChange={(e) => updateEditSetting('default_layer_height', e.target.value)}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        درصد پر شدن پیش‌فرض (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editSettings.default_infill_pct || ''}
                        onChange={(e) => updateEditSetting('default_infill_pct', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {activeTab === 'analytics' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-xl font-bold mb-6">آمار</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">۰</p>
                    <p className="text-[var(--text-secondary)] text-sm">کل قیمت‌ها</p>
                  </div>
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">۰ تومان</p>
                    <p className="text-[var(--text-secondary)] text-sm">کل درآمد</p>
                  </div>
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">۰</p>
                    <p className="text-[var(--text-secondary)] text-sm">این ماه</p>
                  </div>
                </div>
                
                <p className="text-[var(--text-secondary)] text-center py-12">
                  داشبورد آمار به زودی...
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
