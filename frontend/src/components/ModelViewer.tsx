import { useRef, useState, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { OrbitControls, Stage, useProgress, Html, Center } from '@react-three/drei'
import * as THREE from 'three'

interface ModelViewerProps {
  fileUrl?: string
  onMetricsChange?: (metrics: ModelMetrics) => void
}

interface ModelMetrics {
  vertices: number
  faces: number
  volume?: number
  dimensions?: { x: number; y: number; z: number }
}

function ModelScene({ onMetricsChange }: { onMetricsChange?: (metrics: ModelMetrics) => void }) {
  const geometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x6C63FF,
    metalness: 0.3,
    roughness: 0.4,
  }), [])

  return <mesh geometry={geometry} material={material} />
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-[var(--text-secondary)]">{progress.toFixed(0)}%</p>
      </div>
    </Html>
  )
}

export default function ModelViewer({ fileUrl, onMetricsChange }: ModelViewerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['.stl', '.3mf', '.obj']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(fileExt)) {
      setError('فرمت فایل نامعتبر است. فایل‌های STL، 3MF و OBJ پذیرفته می‌شوند.')
      return
    }

    const url = URL.createObjectURL(file)
    setModelUrl(url)
    setFileName(file.name)
    setError(null)

    if (onMetricsChange) {
      onMetricsChange({ vertices: 0, faces: 0 })
    }
  }, [onMetricsChange])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (!file) return

    const validTypes = ['.stl', '.3mf', '.obj']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(fileExt)) {
      setError('فرمت فایل نامعتبر است. فایل‌های STL، 3MF و OBJ پذیرفته می‌شوند.')
      return
    }

    const url = URL.createObjectURL(file)
    setModelUrl(url)
    setFileName(file.name)
    setError(null)

    if (onMetricsChange) {
      onMetricsChange({ vertices: 0, faces: 0 })
    }
  }, [onMetricsChange])

  // If no model loaded, show placeholder
  if (!modelUrl) {
    return (
      <div className="w-full h-[400px] bg-[var(--surface)] rounded-xl overflow-hidden">
        <div
          className="w-full h-full flex flex-col items-center justify-center 
                     border-2 border-dashed border-[var(--surface-light)] 
                     rounded-xl m-0 p-8 cursor-pointer hover:border-[var(--primary)]
                     transition-all duration-300 group"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
            📦
          </div>
          <p className="text-[var(--text-secondary)] text-lg mb-2">
            فایل سه‌بعدی خود را بارگذاری کنید
          </p>
          <p className="text-[var(--text-secondary)] text-sm">
            فایل STL، 3MF یا OBJ را بکشید و رها کنید یا کلیک کنید
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.3mf,.obj"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 
                        rounded-lg p-4 m-4 flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        )}
      </div>
    )
  }

  // Model loaded — show 3D viewer
  return (
    <div className="w-full h-[400px] bg-[var(--surface)] rounded-xl overflow-hidden relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 50 }}
      >
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.6}>
            <ModelScene onMetricsChange={onMetricsChange} />
          </Stage>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>

      {/* Overlay controls */}
      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={() => {
            setModelUrl(null)
            setFileName(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
          }}
          className="btn-secondary text-sm px-4 py-2"
        >
          🔄 تغییر فایل
        </button>
      </div>

      {/* File name overlay */}
      {fileName && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/60 rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)]">
          📄 {fileName}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".stl,.3mf,.obj"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export type { ModelMetrics }
