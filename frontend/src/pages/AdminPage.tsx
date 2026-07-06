import { useState, useEffect } from 'react'
import { useAuthStore } from '../hooks/useAuth'
import { Settings, Package, Users, BarChart3, LogOut, Save, Plus, Trash2, Edit, X, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = '/api/v1'

interface Material {
  id: number
  slug: string
  name: string
  price_per_kg: number
  density_g_cm3: number
  waste_pct: number
  color: string
  notes: string | null
  title_fa: string | null
  is_active: boolean
}

const defaultMaterial: Omit<Material, 'id' | 'slug'> = {
  name: '',
  price_per_kg: 1650000,
  density_g_cm3: 1.24,
  waste_pct: 0.05,
  color: '',
  notes: '',
  title_fa: '',
  is_active: true,
}

export default function AdminPage() {
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('materials')
  const [materials, setMaterials] = useState<Material[]>([])
  const [settings, setSettings] = useState<any>({})
  const [editSettings, setEditSettings] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  
  // Material editing state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)
  const [newMaterial, setNewMaterial] = useState(defaultMaterial)

  useEffect(() => {
    fetchData()
  }, [])
  
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [materialsRes, settingsRes] = await Promise.all([
        axios.get(`${API_URL}/materials/all`),
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
  
  // ── Settings ──
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

  // ── Material CRUD ──
  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim()) {
      toast.error('نام متریال الزامی است')
      return
    }
    try {
      const res = await axios.post(`${API_URL}/materials`, newMaterial)
      setMaterials([...materials, res.data])
      setShowAddModal(false)
      setNewMaterial(defaultMaterial)
      toast.success('متریال اضافه شد!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در افزودن متریال')
    }
  }

  const handleUpdateMaterial = async (mat: Material) => {
    try {
      const res = await axios.put(`${API_URL}/materials/${mat.id}`, {
        name: mat.name,
        price_per_kg: mat.price_per_kg,
        density_g_cm3: mat.density_g_cm3,
        waste_pct: mat.waste_pct,
        color: mat.color,
        notes: mat.notes,
        title_fa: mat.title_fa,
      })
      setMaterials(materials.map(m => m.id === mat.id ? res.data : m))
      setEditMaterial(null)
      toast.success('متریال ویرایش شد!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در ویرایش')
    }
  }

  const handleDeleteMaterial = async (mat: Material) => {
    if (!confirm(`آیا از حذف "${mat.name}" مطمئن هستید؟`)) return
    try {
      await axios.delete(`${API_URL}/materials/${mat.id}`)
      setMaterials(materials.filter(m => m.id !== mat.id))
      toast.success('متریال حذف شد!')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'خطا در حذف')
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
          
          <div className="flex items-center gap-2">
            <a href="/" className="btn-ghost text-sm">🏠 خانه</a>
            <button onClick={logout} className="btn-ghost flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>
      
      {/* Admin Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 space-y-2 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--primary)] text-white'
                    : 'hover:bg-[var(--surface-light)]'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            
            {/* ═══════════════════════ MATERIALS TAB ═══════════════════════ */}
            {activeTab === 'materials' && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">متریال‌ها ({materials.length})</h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    افزودن متریال
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-12"><div className="spinner" /></div>
                ) : (
                  <div className="space-y-3">
                    {materials.map((mat) => (
                      <div key={mat.id} className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--surface-light)]">
                        {editMaterial?.id === mat.id ? (
                          /* ── Edit Mode ── */
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">نام</label>
                                <input value={editMaterial.name}
                                  onChange={(e) => setEditMaterial({...editMaterial, name: e.target.value})}
                                  className="input text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">قیمت/کیلو (تومان)</label>
                                <input type="number" value={editMaterial.price_per_kg}
                                  onChange={(e) => setEditMaterial({...editMaterial, price_per_kg: Number(e.target.value)})}
                                  className="input text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">چگالی (g/cm³)</label>
                                <input type="number" step="0.01" value={editMaterial.density_g_cm3}
                                  onChange={(e) => setEditMaterial({...editMaterial, density_g_cm3: Number(e.target.value)})}
                                  className="input text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-[var(--text-secondary)] mb-1">رنگ</label>
                                <input value={editMaterial.color || ''}
                                  onChange={(e) => setEditMaterial({...editMaterial, color: e.target.value})}
                                  className="input text-sm" />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditMaterial(null)}
                                className="btn-ghost text-sm flex items-center gap-1">
                                <X className="w-4 h-4" /> لغو
                              </button>
                              <button onClick={() => handleUpdateMaterial(editMaterial)}
                                className="btn-primary text-sm flex items-center gap-1">
                                <Check className="w-4 h-4" /> ذخیره
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── View Mode ── */
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mat.color || '#666' }} />
                              <div>
                                <p className="font-medium">{mat.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {mat.price_per_kg.toLocaleString()} تومان/کیلو · {mat.color || '-'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setEditMaterial(mat)}
                                className="btn-ghost text-sm p-2" title="ویرایش">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMaterial(mat)}
                                className="text-red-400 hover:text-red-300 p-2" title="حذف">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {materials.length === 0 && (
                      <p className="text-[var(--text-secondary)] text-center py-8">متریالی وجود ندارد</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* ═══════════════════════ SETTINGS TAB ═══════════════════════ */}
            {activeTab === 'settings' && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">تنظیمات</h2>
                  <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    ذخیره تغییرات
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">نرخ برق (تومان/کیلووات‌ساعت)</label>
                    <input type="number" value={editSettings.electricity_rate_per_kwh || ''}
                      onChange={(e) => updateEditSetting('electricity_rate_per_kwh', e.target.value)}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">هزینه سربار (%)</label>
                    <input type="number" step="0.01" value={editSettings.overhead_pct || ''}
                      onChange={(e) => updateEditSetting('overhead_pct', e.target.value)}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">سود (%)</label>
                    <input type="number" step="0.01" value={editSettings.markup_pct || ''}
                      onChange={(e) => updateEditSetting('markup_pct', e.target.value)}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">هزینه کارگر (تومان/ساعت)</label>
                    <input type="number" value={editSettings.coloring_cost_per_hour || ''}
                      onChange={(e) => updateEditSetting('coloring_cost_per_hour', e.target.value)}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">ارتفاع لایه پیش‌فرض (mm)</label>
                    <input type="number" step="0.01" value={editSettings.default_layer_height || ''}
                      onChange={(e) => updateEditSetting('default_layer_height', e.target.value)}
                      className="input" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">درصد پر شدن پیش‌فرض (%)</label>
                    <input type="number" step="0.01" value={editSettings.default_infill_pct || ''}
                      onChange={(e) => updateEditSetting('default_infill_pct', e.target.value)}
                      className="input" />
                  </div>
                </div>
              </div>
            )}
            
            {/* ═══════════════════════ ANALYTICS TAB ═══════════════════════ */}
            {activeTab === 'analytics' && (
              <div className="card">
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
                    <p className="text-3xl font-bold gradient-text">{materials.length}</p>
                    <p className="text-[var(--text-secondary)] text-sm">متریال فعال</p>
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-center py-12">داشبورد آمار به زودی...</p>
              </div>
            )}
          </main>
        </div>
      </div>
      
      {/* ═══════════════════════ ADD MATERIAL MODAL ═══════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="card w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">افزودن متریال جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-[var(--surface-light)] rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">نام *</label>
                <input value={newMaterial.name}
                  onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                  placeholder="مثلاً PLA Silk Pink" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">قیمت/کیلو (تومان) *</label>
                  <input type="number" value={newMaterial.price_per_kg}
                    onChange={(e) => setNewMaterial({...newMaterial, price_per_kg: Number(e.target.value)})}
                    className="input" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">رنگ</label>
                  <input value={newMaterial.color || ''}
                    onChange={(e) => setNewMaterial({...newMaterial, color: e.target.value})}
                    placeholder="مثلاً Pink" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">چگالی (g/cm³)</label>
                  <input type="number" step="0.01" value={newMaterial.density_g_cm3}
                    onChange={(e) => setNewMaterial({...newMaterial, density_g_cm3: Number(e.target.value)})}
                    className="input" />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">ضایعات (%)</label>
                  <input type="number" step="0.01" value={newMaterial.waste_pct}
                    onChange={(e) => setNewMaterial({...newMaterial, waste_pct: Number(e.target.value)})}
                    className="input" />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setShowAddModal(false)} className="btn-ghost">لغو</button>
              <button onClick={handleAddMaterial} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> افزودن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
