import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calculator, Box, Zap, Shield, ArrowLeft } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: Calculator,
      title: 'قیمت‌دهی آنی',
      description: 'فایل STL خود را آپلود کنید و فوراً برآورد قیمت با جزئیات کامل دریافت کنید.'
    },
    {
      icon: Box,
      title: 'پیش‌نمایش سه‌بعدی',
      description: 'مدل خود را قبل از چاپ به صورت سه‌بعدی مشاهده کنید. ابعاد و پیچیدگی را ببینید.'
    },
    {
      icon: Zap,
      title: 'پردازش سریع',
      description: 'با قدرت trimesh تحلیل مش و محاسبات با سرعت بالا انجام می‌شود.'
    },
    {
      icon: Shield,
      title: 'امن و خصوصی',
      description: 'فایل‌ها و داده‌های شما به صورت امن پردازش می‌شوند. بدون سرور خارجی.'
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
            محاسبه‌گر مدرن چاپ سه‌بعدی
          </span>
        </h1>
        
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10">
          فایل‌های سه‌بعدی خود را آپلود کنید، متریال را انتخاب کنید و فوراً قیمت دقیق دریافت کنید.
          با فناوری پیشرفته تحلیل مش.
        </p>
        
        <Link to="/quote" className="btn-primary inline-flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          دریافت قیمت
          <ArrowLeft className="w-5 h-5" />
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
        <h2 className="text-3xl font-bold text-center mb-12">چگونه کار می‌کند؟</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '۱', title: 'آپلود فایل', desc: 'فایل STL، 3MF یا OBJ خود را بکشید و رها کنید' },
            { step: '۲', title: 'انتخاب گزینه‌ها', desc: 'متریال، ارتفاع لایه و درصد پر شدن را انتخاب کنید' },
            { step: '۳', title: 'دریافت قیمت', desc: 'قیمت فوری با جزئیات کامل هزینه دریافت کنید' }
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
        <p>ساخته شده با ❤️ برای علاقه‌مندان چاپ سه‌بعدی</p>
        <p className="mt-2">3DJAT Quote v2.0</p>
      </footer>
    </div>
  )
}
