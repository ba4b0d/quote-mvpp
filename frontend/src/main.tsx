import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { Toaster } from 'react-hot-toast'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#232440',
            color: '#e8e6f0',
            border: '1px solid #363760',
            fontFamily: 'Vazirmatn, system-ui, sans-serif',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#6C63FF',
              secondary: '#232440',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff6b6b',
              secondary: '#232440',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
