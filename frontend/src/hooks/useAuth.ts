import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api/v1'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  user: { username: string; role: string } | null
  
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('staff_token'),
  isAuthenticated: false,
  isLoading: true,
  user: null,
  
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      })
      
      const { access_token, role } = response.data
      
      localStorage.setItem('staff_token', access_token)
      localStorage.setItem('staff_role', role)
      
      set({
        token: access_token,
        isAuthenticated: true,
        isLoading: false,
        user: { username, role }
      })
      
      return true
    } catch (error) {
      set({ isLoading: false })
      return false
    }
  },
  
  logout: () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('staff_role')
    set({
      token: null,
      isAuthenticated: false,
      user: null
    })
  },
  
  checkAuth: async () => {
    const token = localStorage.getItem('staff_token')
    
    if (!token) {
      set({ isAuthenticated: false, isLoading: false, user: null })
      return
    }
    
    try {
      const response = await axios.post(`${API_URL}/auth/verify`, null, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.valid) {
        set({
          isAuthenticated: true,
          isLoading: false,
          user: {
            username: response.data.username,
            role: response.data.role
          }
        })
      } else {
        localStorage.removeItem('staff_token')
        localStorage.removeItem('staff_role')
        set({ isAuthenticated: false, isLoading: false, user: null })
      }
    } catch (error) {
      localStorage.removeItem('staff_token')
      localStorage.removeItem('staff_role')
      set({ isAuthenticated: false, isLoading: false, user: null })
    }
  }
}))
