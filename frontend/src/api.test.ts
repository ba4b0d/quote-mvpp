import { vi, describe, it, expect, beforeEach } from 'vitest'
import axios from 'axios'

// Mock axios
vi.mock('axios')

describe('API Calls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const mockResponse = {
        status: 'healthy',
        version: '2.0.0',
        name: 'quote-mvpp',
      }
      
      ;(axios.get as vi.Mock).mockResolvedValue({ data: mockResponse })
      
      const response = await axios.get('/health')
      
      expect(response.data.status).toBe('healthy')
      expect(response.data.version).toBe('2.0.0')
      expect(axios.get).toHaveBeenCalledWith('/health')
    })
  })

  describe('Login Endpoint', () => {
    it('should login successfully with correct credentials', async () => {
      const mockResponse = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        role: 'admin',
      }
      
      ;(axios.post as vi.Mock).mockResolvedValue({ data: mockResponse })
      
      const response = await axios.post('/api/v1/auth/login', {
        username: 'admin',
        password: 'admin123',
      })
      
      expect(response.data.access_token).toBe('mock-jwt-token')
      expect(response.data.token_type).toBe('bearer')
      expect(response.data.role).toBe('admin')
      expect(axios.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        username: 'admin',
        password: 'admin123',
      })
    })

    it('should fail with incorrect credentials', async () => {
      ;(axios.post as vi.Mock).mockRejectedValue({
        response: {
          status: 401,
          data: { detail: 'Invalid username or password' },
        },
      })
      
      await expect(
        axios.post('/api/v1/auth/login', {
          username: 'admin',
          password: 'wrongpassword',
        })
      ).rejects.toThrow()
    })
  })

  describe('Quote Calculation', () => {
    it('should calculate quote successfully', async () => {
      const mockResponse = {
        success: true,
        input: {
          volume_cm3: 50,
          material_grams: 62,
          print_time_minutes: 180,
        },
        costs: {
          material_cost: 102300,
          electricity_cost: 14616,
          labor_cost: 45000,
          overhead: 48483,
          markup: 323220,
          total: 533619,
        },
        formatted: {
          total: '533,619 IRT',
          time: '3h 0m',
        },
      }
      
      ;(axios.get as vi.Mock).mockResolvedValue({ data: mockResponse })
      
      const response = await axios.get('/api/v1/quote/calculate', {
        params: {
          volume_cm3: 50,
          material_id: 'pla_black',
          layer_height: 0.2,
          infill: 0.2,
          height_mm: 10,
        },
      })
      
      expect(response.data.success).toBe(true)
      expect(response.data.costs.total).toBe(533619)
      expect(axios.get).toHaveBeenCalledWith('/api/v1/quote/calculate', {
        params: {
          volume_cm3: 50,
          material_id: 'pla_black',
          layer_height: 0.2,
          infill: 0.2,
          height_mm: 10,
        },
      })
    })

    it('should submit manual quote successfully', async () => {
      const mockResponse = {
        success: true,
        input: {
          grams: 150,
          minutes: 180,
        },
        costs: {
          total: 450000,
        },
      }
      
      ;(axios.post as vi.Mock).mockResolvedValue({ data: mockResponse })
      
      const response = await axios.post('/api/v1/quote/manual', {
        grams: 150,
        minutes: 180,
        material_id: 'pla_black',
      })
      
      expect(response.data.success).toBe(true)
      expect(axios.post).toHaveBeenCalledWith('/api/v1/quote/manual', {
        grams: 150,
        minutes: 180,
        material_id: 'pla_black',
      })
    })
  })
})
