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
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #2d2d2e',
          },
          success: {
            iconTheme: {
              primary: '#00d4aa',
              secondary: '#0f0f0f',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f0f0f',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
