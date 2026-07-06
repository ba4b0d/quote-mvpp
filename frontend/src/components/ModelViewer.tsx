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

function Model({ onMetricsChange }: { onMetricsChange?: (metrics: ModelMetrics) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['.stl', '.3mf', '.obj']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!validTypes.includes(fileExt)) {
      setError('Invalid file type. Please upload STL, 3MF, or OBJ files.')
      return
    }
    
    // Create URL for the file
    const url = URL.createObjectURL(file)
    setModelUrl(url)
    setError(null)
    
    // Analyze file
    analyzeFile(file)
  }, [])
  
  const analyzeFile = async (file: File) => {
    // Create a temporary URL for analysis
    const url = URL.createObjectURL(file)
    
    // Load the model using trimesh logic
    // For now, we'll use basic file analysis
    const stats = {
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(2) + ' KB',
      fileType: file.name.split('.').pop()?.toUpperCase(),
    }
    
    // Emit basic metrics
    if (onMetricsChange) {
      onMetricsChange({
        vertices: 0,
        faces: 0,
      })
    }
  }
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* File upload area */}
      {!modelUrl && (
        <div 
          className="flex-1 flex flex-col items-center justify-center 
                     border-2 border-dashed border-[var(--surface-light)] 
                     rounded-xl m-4 p-8 cursor-pointer hover:border-[var(--primary)]
                     transition-all duration-300 group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
            📦
          </div>
          <p className="text-[var(--text-secondary)] text-lg mb-2">
            Drag & drop your 3D file here
          </p>
          <p className="text-[var(--text-secondary)] text-sm">
            or click to browse (STL, 3MF, OBJ)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl,.3mf,.obj"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}
      
      {/* 3D Viewer */}
      {modelUrl && (
        <div className="flex-1 relative">
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 0, 10], fov: 50 }}
            className="w-full h-full rounded-xl overflow-hidden"
          >
            <Suspense fallback={<Loader />}>
              <Stage environment="city" intensity={0.6}>
                <ModelLoader url={modelUrl} />
              </Stage>
              <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
            </Suspense>
          </Canvas>
          
          {/* Overlay controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => {
                setModelUrl(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="btn-secondary text-sm px-4 py-2"
            >
              🔄 Change File
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
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

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-[var(--text-secondary)]">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  )
}

function ModelLoader({ url }: { url: string }) {
  // Note: In production, you'd use trimesh to load the actual file
  // For now, we'll show a placeholder geometry
  const geometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: 0x00d4aa,
    metalness: 0.3,
    roughness: 0.4,
  }), [])

  return (
    <mesh geometry={geometry} material={material} />
  )
}

export default function ModelViewer({ fileUrl, onMetricsChange }: ModelViewerProps) {
  return (
    <div className="w-full h-[400px] bg-[var(--surface)] rounded-xl overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 50 }}
      >
        <Suspense fallback={<Loader />}>
          <Stage environment="city" intensity={0.6}>
            <Model onMetricsChange={onMetricsChange} />
          </Stage>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export type { ModelMetrics }
