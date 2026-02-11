import { create } from 'zustand'
import axios from 'axios'

const API_URL = '/api/v1'

interface QuoteState {
  quote: any | null
  isLoading: boolean
  error: string | null
  
  // Materials
  materials: any[]
  isLoadingMaterials: boolean
  
  // Actions
  quote: (
    file: File | null,
    materialId: string,
    layerHeight: number,
    infill: number,
    manual?: { grams: number; minutes: number }
  ) => Promise<void>
  
  fetchMaterials: () => Promise<void>
  
  reset: () => void
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  quote: null,
  isLoading: false,
  error: null,
  
  materials: [],
  isLoadingMaterials: false,
  
  quote: async (file, materialId, layerHeight, infill, manual) => {
    set({ isLoading: true, error: null, quote: null })
    
    try {
      let result
      
      if (file) {
        // File upload mode
        const formData = new FormData()
        formData.append('file', file)
        formData.append('material_id', materialId)
        formData.append('layer_height', layerHeight.toString())
        formData.append('infill', infill.toString())
        
        const response = await axios.post(`${API_URL}/quote/estimate`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        result = response.data
      } else if (manual) {
        // Manual input mode
        const response = await axios.post(`${API_URL}/quote/manual`, {
          grams: manual.grams,
          minutes: manual.minutes,
          material_id: materialId
        })
        result = response.data
      }
      
      set({ quote: result, isLoading: false })
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Error calculating quote',
        isLoading: false 
      })
    }
  },
  
  fetchMaterials: async () => {
    set({ isLoadingMaterials: true })
    try {
      const response = await axios.get(`${API_URL}/materials`)
      set({ materials: response.data, isLoadingMaterials: false })
    } catch (error) {
      set({ isLoadingMaterials: false })
    }
  },
  
  reset: () => {
    set({ quote: null, error: null })
  }
}))
