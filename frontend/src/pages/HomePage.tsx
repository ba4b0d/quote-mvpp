import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calculator, Box, Zap, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Calculator,
      title: 'Instant Quotes',
      description: 'Upload your STL file and get an instant price estimate with detailed breakdown.'
    },
    {
      icon: Box,
      title: '3D Preview',
      description: 'Visualize your model in 3D before printing. See dimensions and complexity.'
    },
    {
      icon: Zap,
      title: 'Fast Processing',
      description: 'Powered by trimesh for lightning-fast mesh analysis and calculations.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your files and data are processed securely. No external servers involved.'
    }
  ]
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-20 text-center"
      >
        <h1 className="text-5xl font-bold mb-6">
          <span className="gradient-text">3DJAT Quote</span>
          <br />
          <span className="text-3xl text-[var(--text-secondary)]">
            Modern 3D Printing Calculator
          </span>
        </h1>
        
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
          Upload your 3D files, select your material, and get instant accurate quotes.
          Powered by advanced mesh analysis technology.
        </p>
        
        <Link to="/quote" className="btn-primary inline-flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Get a Quote
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
      
      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:scale-105"
            >
              <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* How It Works */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', title: 'Upload File', desc: 'Drag & drop your STL, 3MF, or OBJ file' },
            { step: '2', title: 'Select Options', desc: 'Choose material, layer height, and infill' },
            { step: '3', title: 'Get Quote', desc: 'Receive instant price with full breakdown' }
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-[var(--primary)] text-black font-bold text-2xl rounded-full flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-[var(--text-secondary)] text-sm">
        <p>Built with ❤️ for 3D printing enthusiasts</p>
        <p className="mt-2">3DJAT Quote v2.0</p>
      </footer>
    </div>
  )
}
