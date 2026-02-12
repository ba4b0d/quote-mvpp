import { useState, useCallback } from 'react'
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
  
  const { quote: quoteResult, isLoading, quote: fetchQuote } = useQuoteStore()
  
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
      toast.error('Please select a file first')
      return
    }
    
    if (mode === 'manual' && (!manualGrams || !manualMinutes)) {
      toast.error('Please enter grams and minutes')
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
      toast.success('Quote calculated!')
    } catch (error) {
      toast.error('Error calculating quote')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: File Upload & 3D Preview */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-[var(--primary)]" />
              Upload 3D File
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
                  {selectedFile ? selectedFile.name : 'Drop STL/3MF file here or click to browse'}
                </p>
                {selectedFile && (
                  <p className="text-sm text-[var(--primary)] mt-2">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </label>
            </div>
          </div>
          
          {/* 3D Preview */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--primary)]" />
              3D Preview
            </h2>
            <ModelViewer />
          </div>
        </div>
        
        {/* Right: Options & Quote */}
        <div className="space-y-6">
          {/* Material Selection */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[var(--primary)]" />
              Options
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Material
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className="select"
                >
                  <option value="pla_black">PLA Black - 1,650,000 IRT/kg</option>
                  <option value="pla_orange">PLA Orange - 1,650,000 IRT/kg</option>
                  <option value="pla_gray">PLA Gray - 1,650,000 IRT/kg</option>
                  <option value="pla_red">PLA Red - 1,650,000 IRT/kg</option>
                  <option value="pla_white">PLA White - 1,650,000 IRT/kg</option>
                  <option value="pla_silk">PLA Silk - 1,750,000 IRT/kg</option>
                  <option value="petg">PETG - 1,750,000 IRT/kg</option>
                  <option value="tpu">TPU (95A) - 2,480,000 IRT/kg</option>
                  <option value="wood">WOOD - 1,750,000 IRT/kg</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Layer Height: {layerHeight}mm
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
                  Infill: {(infill * 100).toFixed(0)}%
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
                  File Mode
                </button>
                <button
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
                    mode === 'manual' 
                      ? 'bg-[var(--primary)] text-black' 
                      : 'bg-[var(--surface-light)]'
                  }`}
                >
                  Manual Input
                </button>
              </div>
              
              {mode === 'manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">
                      Grams
                    </label>
                    <input
                      type="number"
                      value={manualGrams}
                      onChange={(e) => setManualGrams(e.target.value)}
                      placeholder="e.g., 150"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">
                      Minutes
                    </label>
                    <input
                      type="number"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      placeholder="e.g., 180"
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
            {isLoading ? 'Calculating...' : 'Calculate Quote'}
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
                Quote Result
              </h2>
              
              <div className="text-center mb-6">
                <p className="text-[var(--text-secondary)] text-sm">Total Cost</p>
                <p className="text-4xl font-bold gradient-text">
                  {quoteResult.formatted?.total || `${quoteResult.costs?.total?.toLocaleString()} IRT`}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--surface-light)] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <Clock className="w-4 h-4" />
                    Print Time
                  </div>
                  <p className="text-lg font-bold">
                    {quoteResult.print_time?.hours || 0}h {quoteResult.print_time?.minutes || 0}m
                  </p>
                </div>
                
                <div className="bg-[var(--surface-light)] rounded-lg p-4">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <Package className="w-4 h-4" />
                    Material
                  </div>
                  <p className="text-lg font-bold">
                    {quoteResult.mesh_metrics?.material_grams?.toFixed(0) || quoteResult.input?.material_grams?.toFixed(0)}g
                  </p>
                </div>
              </div>
              
              {/* Cost Breakdown */}
              <div className="mt-4 pt-4 border-t border-[var(--surface-light)]">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Cost Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Material</span>
                    <span>{quoteResult.costs?.material_cost?.toLocaleString()} IRT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Electricity</span>
                    <span>{quoteResult.costs?.electricity_cost?.toLocaleString()} IRT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor</span>
                    <span>{quoteResult.costs?.labor_cost?.toLocaleString()} IRT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead</span>
                    <span>{quoteResult.costs?.overhead?.toLocaleString()} IRT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Markup</span>
                    <span>{quoteResult.costs?.markup?.toLocaleString()} IRT</span>
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
