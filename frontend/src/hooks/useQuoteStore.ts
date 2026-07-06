import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api/v1'

interface QuoteState {
  quote: any | null
  isLoading: boolean
  error: string | null
  materials: any[]
  
  fetchQuote: (
    file: File | null,
    materialId: string,
    layerHeight: number,
    infill: number,
    manual?: { grams: number; minutes: number }
  ) => Promise<void>
  
  fetchMaterials: () => Promise<void>
  reset: () => void
}

export const useQuoteStore = create<QuoteState>((set) => ({
  quote: null,
  isLoading: false,
  error: null,
  materials: [],
  
  fetchQuote: async (file, materialId, layerHeight, infill, manual) => {
    set({ isLoading: true, error: null })
    
    try {
      let response
      
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('material_id', materialId)
        formData.append('layer_height', layerHeight.toString())
        formData.append('infill', infill.toString())
        
        response = await axios.post(`${API_URL}/quote/estimate`, formData)
      } else if (manual) {
        response = await axios.post(`${API_URL}/quote/manual`, {
          grams: manual.grams,
          minutes: manual.minutes,
          material_id: materialId
        })
      } else {
        throw new Error('No file or manual input provided')
      }
      
      set({ quote: response.data, isLoading: false })
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error calculating quote'
      set({ error: errorMsg, isLoading: false })
      throw error
    }
  },
  
  fetchMaterials: async () => {
    try {
      const response = await axios.get(`${API_URL}/materials`)
      set({ materials: response.data })
    } catch (error) {
      console.error('Failed to fetch materials:', error)
    }
  },
  
  reset: () => {
    set({ quote: null, error: null })
  }
}))
