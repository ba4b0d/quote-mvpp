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
    } catch (error) {
      toast.error('Error loading data')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveSettings = async () => {
    try {
      // Save settings logic here
      toast.success('Settings saved!')
    } catch (error) {
      toast.error('Error saving settings')
    }
  }
  
  const tabs = [
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]
  
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Admin Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--surface-light)] px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <span className="text-sm text-[var(--text-secondary)]">
              Welcome, {user?.username}
            </span>
          </div>
          
          <button
            onClick={logout}
            className="btn-ghost flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
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
                  <h2 className="text-xl font-bold">Materials</h2>
                  <button className="btn-secondary text-sm">
                    + Add Material
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
                          <th className="pb-3 font-normal">Name</th>
                          <th className="pb-3 font-normal">Price/kg</th>
                          <th className="pb-3 font-normal">Density</th>
                          <th className="pb-3 font-normal">Color</th>
                          <th className="pb-3 font-normal">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((mat, index) => (
                          <tr
                            key={index}
                            className="border-b border-[var(--surface-light)] hover:bg-[var(--surface-light)]/50"
                          >
                            <td className="py-3">{mat.name}</td>
                            <td className="py-3">{mat.price_per_kg?.toLocaleString()} IRT</td>
                            <td className="py-3">{mat.density_g_cm3}g/cm³</td>
                            <td className="py-3">{mat.color}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] text-xs rounded">
                                Active
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
                  <h2 className="text-xl font-bold">Settings</h2>
                  <button
                    onClick={handleSaveSettings}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Electricity Rate (IRT/kWh)
                      </label>
                      <input
                        type="number"
                        defaultValue={settings.electricity_rate_per_kwh}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Overhead (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={settings.overhead_pct}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Markup (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={settings.markup_pct}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Labor Cost (IRT/hour)
                      </label>
                      <input
                        type="number"
                        defaultValue={settings.coloring_cost_per_hour}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Default Layer Height (mm)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={settings.default_layer_height}
                        className="input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-2">
                        Default Infill (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={settings.default_infill_pct}
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
                <h2 className="text-xl font-bold mb-6">Analytics</h2>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">0</p>
                    <p className="text-[var(--text-secondary)] text-sm">Total Quotes</p>
                  </div>
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">0 IRT</p>
                    <p className="text-[var(--text-secondary)] text-sm">Total Revenue</p>
                  </div>
                  <div className="bg-[var(--surface-light)] rounded-lg p-6 text-center">
                    <p className="text-3xl font-bold gradient-text">0</p>
                    <p className="text-[var(--text-secondary)] text-sm">This Month</p>
                  </div>
                </div>
                
                <p className="text-[var(--text-secondary)] text-center py-12">
                  Analytics dashboard coming soon...
                </p>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
