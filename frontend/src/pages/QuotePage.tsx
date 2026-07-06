import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Settings, Calculator, DollarSign, Clock, Package } from 'lucide-react'
import ModelViewer, { ModelMetrics } from '../components/ModelViewer'
import { useQuoteStore } from '../hooks/useQuoteStore'
import toast from 'react-hot-toast'

export default function QuotePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [materialId, setMaterialId] = useState('pla_black')
  const [layerHeight, setLayerHeight] = useState(0.2)
  const [infill, setInfill] = useState(0.2)
  const [mode, setMode] = useState<'file' | 'manual'>('file')
  const [manualGrams, setManualGrams] = useState('')
  const [manualMinutes, setManualMinutes] = useState('')
  
  const { quote: quoteResult, isLoading, fetchQuote, fetchMaterials, materials } = useQuoteStore()
  
  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])
  
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setMode('file')
    }
  }, [])
  
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      setSelectedFile(file)
      setMode('file')
    }
  }, [])
  
  const handleCalculate = async () => {
    if (mode === 'file' && !selectedFile) {
      toast.error('لطفاً ابتدا یک فایل انتخاب کنید')
      return
    }
    
    if (mode === 'manual' && (!manualGrams || !manualMinutes)) {
      toast.error('لطفاً گرم و دقیقه را وارد کنید')
      return
    }
    
    try {
      if (mode === 'file') {
        await fetchQuote(selectedFile!, materialId, layerHeight, infill)
      } else {
        await fetchQuote(null, materialId, layerHeight, infill, {
          grams: parseFloat(manualGrams),
          minutes: parseFloat(manualMinutes)
        })
      }
      toast.success('قیمت محاسبه شد!')
    } catch (error) {
      toast.error('خطا در محاسبه قیمت')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Right: File Upload & 3D Preview (RTL — right side first) */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[var(--primary)]" />
              آپلود فایل سه‌بعدی
            </h2>
            
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-[var(--surface-light)] 
                         rounded-xl p-8 text-center cursor-pointer
                         hover:border-[var(--primary)] transition-colors"
            >
              <input
                type="file"
                accept=".stl,.3mf,.obj"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-[var(--text-secondary)]">
                  {selectedFile ? selectedFile.name : 'فایل STL/3MF را اینجا رها کنید یا کلیک کنید'}
                </p>
                {selectedFile && (
                  <p className="text-sm text-[var(--primary)] mt-2">
                    {(selectedFile.size / 1024).toFixed(2)} کیلوبایت
                  </p>
                )}
              </label>
            </div>
          </div>
          
          {/* 3D Preview */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              پیش‌نمایش سه‌بعدی
            </h2>
            <ModelViewer />
          </div>
        </div>
        
        {/* Left: Options & Quote (RTL — left side second) */}
        <div className="space-y-6">
          {/* Material Selection */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--primary)]" />
              گزینه‌ها
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  متریال
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="select"
                >
                  {materials.length > 0 ? (
                    materials.map((mat: any) => (
                      <option key={mat.id || mat.material_id} value={mat.id || mat.material_id}>
                        {mat.name} - {mat.price_per_kg?.toLocaleString()} تومان/کیلوگرم
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>در حال بارگذاری متریال‌ها...</option>
                  )}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  ارتفاع لایه: {layerHeight}mm
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.3"
                  step="0.02"
                  value={layerHeight}
                  onChange={(e) => setLayerHeight(parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
              
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  درصد پر شدن: {(infill * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={infill}
                  onChange={(e) => setInfill(parseFloat(e.target.value))}
                  className="slider"
                />
              </div>
              
              {/* Manual Input Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('file')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    mode === 'file' 
                      ? 'bg-[var(--primary)] text-black' 
                      : 'bg-[var(--surface-light)]'
                  }`}
                >
                  حالت فایل
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    mode === 'manual' 
                      ? 'bg-[var(--primary)] text-black' 
                      : 'bg-[var(--surface-light)]'
                  }`}
                >
                  ورودی دستی
                </button>
              </div>
              
              {mode === 'manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">
                      گرم
                    </label>
                    <input
                      type="number"
                      value={manualGrams}
                      onChange={(e) => setManualGrams(e.target.value)}
                      placeholder="مثلاً ۱۵۰"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">
                      دقیقه
                    </label>
                    <input
                      type="number"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      placeholder="مثلاً ۱۸۰"
                      className="input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={isLoading || (mode === 'file' && !selectedFile) || (mode === 'manual' && (!manualGrams || !manualMinutes))}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Calculator className="w-5 h-5" />
            {isLoading ? 'در حال محاسبه...' : 'محاسبه قیمت'}
          </button>
          
          {/* Quote Result */}
          {quoteResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card"
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[var(--primary)]" />
                نتیجه قیمت
              </h2>
              
              <div className="text-center mb-6">
                <p className="text-[var(--text-secondary)] text-sm">هزینه کل</p>
                <p className="text-4xl font-bold gradient-text">
                  {quoteResult.formatted?.total || `${quoteResult.costs?.total?.toLocaleString()} تومان`}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface-light)] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <Clock className="w-4 h-4" />
                    زمان چاپ
                  </div>
                  <p className="text-lg font-bold">
                    {quoteResult.print_time?.hours || 0} ساعت {quoteResult.print_time?.minutes || 0} دقیقه
                  </p>
                </div>
                
                <div className="bg-[var(--surface-light)] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <Package className="w-4 h-4" />
                    متریال
                  </div>
                  <p className="text-lg font-bold">
                    {quoteResult.mesh_metrics?.material_grams?.toFixed(0) || quoteResult.input?.material_grams?.toFixed(0)} گرم
                  </p>
                </div>
              </div>
              
              {/* Cost Breakdown */}
              <div className="mt-4 pt-4 border-t border-[var(--surface-light)]">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  جزئیات هزینه
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>متریال</span>
                    <span>{quoteResult.costs?.material_cost?.toLocaleString()} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>برق</span>
                    <span>{quoteResult.costs?.electricity_cost?.toLocaleString()} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>کارگر</span>
                    <span>{quoteResult.costs?.labor_cost?.toLocaleString()} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>هزینه‌های سربار</span>
                    <span>{quoteResult.costs?.overhead?.toLocaleString()} تومان</span>
                  </div>
                  <div className="flex justify-between">
                    <span>سود</span>
                    <span>{quoteResult.costs?.markup?.toLocaleString()} تومان</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
