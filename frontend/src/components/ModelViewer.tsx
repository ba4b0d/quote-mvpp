import { useRef, useState, useCallback, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls, Stage, useProgress, Html, Center } from '@react-three/drei'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
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

function STLModel({ url, onMetricsChange }: { url: string; onMetricsChange?: (metrics: ModelMetrics) => void }) {
  const geometry = useLoader(STLLoader, url)
  
  useEffect(() => {
    if (geometry && onMetricsChange) {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox!
      const size = new THREE.Vector3()
      box.getSize(size)
      
      onMetricsChange({
        vertices: geometry.attributes.position.count,
        faces: geometry.index ? geometry.index.count / 3 : geometry.attributes.position.count / 3,
        dimensions: { x: size.x, y: size.y, z: size.z }
      })
    }
  }, [geometry, onMetricsChange])

  return (
    <Center>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={0x6C63FF}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
    </Center>
  )
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

  const handleFile = useCallback((file: File) => {
    const validTypes = ['.stl', '.3mf', '.obj']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!validTypes.includes(fileExt)) {
      setError('فرمت فایل نامعتبر است. فایل‌های STL، 3MF و OBJ پذیرفته می‌شوند.')
      return
    }

    // Revoke previous URL to avoid memory leaks
    if (modelUrl) URL.revokeObjectURL(modelUrl)
    
    const url = URL.createObjectURL(file)
    setModelUrl(url)
    setFileName(file.name)
    setError(null)
  }, [modelUrl])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  // If no model loaded, show placeholder
  if (!modelUrl) {
    return (
      <div className="w-full h-[400px] bg-[var(--surface)] rounded-xl overflow-hidden">
        <div
          className="w-full h-full flex flex-col items-center justify-center 
                     border-2 border-dashed border-[var(--border)] 
                     rounded-xl m-0 p-8 cursor-pointer hover:border-[var(--primary)]
                     transition-all duration-300 group"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📦</div>
          <p className="text-[var(--text-secondary)] text-lg mb-2">فایل سه‌بعدی خود را بارگذاری کنید</p>
          <p className="text-[var(--text-secondary)] text-sm">STL، 3MF یا OBJ</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.3mf,.obj"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-4 m-4">
            ⚠️ {error}
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
        camera={{ position: [0, 0, 100], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.6}>
            <STLModel url={modelUrl} onMetricsChange={onMetricsChange} />
          </Stage>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={1} />
        </Suspense>
      </Canvas>

      {/* Overlay controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => {
            if (modelUrl) URL.revokeObjectURL(modelUrl)
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
