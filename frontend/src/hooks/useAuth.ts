import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api/v1'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: { username: string; role: string } | null
  
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('staff_token'),
  isAuthenticated: !!localStorage.getItem('staff_token'),
  user: localStorage.getItem('staff_username') 
    ? { username: localStorage.getItem('staff_username')!, role: localStorage.getItem('staff_role') || 'staff' }
    : null,
  
  login: async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      })
      
      const { access_token, role } = response.data
      
      localStorage.setItem('staff_token', access_token)
      localStorage.setItem('staff_role', role)
      localStorage.setItem('staff_username', username)
      
      set({
        token: access_token,
        isAuthenticated: true,
        user: { username, role }
      })
      
      return true
    } catch (error) {
      return false
    }
  },
  
  logout: () => {
    localStorage.removeItem('staff_token')
    localStorage.removeItem('staff_role')
    localStorage.removeItem('staff_username')
    set({
      token: null,
      isAuthenticated: false,
      user: null
    })
  }
}))
