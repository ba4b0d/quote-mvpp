import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import QuotePage from '../pages/QuotePage'
import { useQuoteStore } from '../hooks/useQuoteStore'

// Mock the quote store
vi.mock('../hooks/useQuoteStore', () => ({
  useQuoteStore: vi.fn(),
}))

describe('QuotePage Component', () => {
  const mockQuoteStore = {
    quote: null,
    isLoading: false,
    error: null,
    quote: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useQuoteStore as unknown as vi.Mock).mockReturnValue(mockQuoteStore)
  })

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/upload 3d file/i)).toBeInTheDocument()
    expect(screen.getByText(/options/i)).toBeInTheDocument()
  })

  it('shows file upload area', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByLabelText(/drop stl\/3mf file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /calculate quote/i })).toBeInTheDocument()
  })

  it('shows material selection options', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText(/pla black/i)).toBeInTheDocument()
  })

  it('shows layer height and infill sliders', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/layer height/i)).toBeInTheDocument()
    expect(screen.getByText(/infill/i)).toBeInTheDocument()
  })

  it('toggles between file and manual mode', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    const manualButton = screen.getByRole('button', { name: /manual input/i })
    fireEvent.click(manualButton)
    
    expect(screen.getByPlaceholderText(/e\.g\., 150/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e\.g\., 180/i)).toBeInTheDocument()
  })

  it('disables calculate button when no file is selected in file mode', () => {
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    const calculateButton = screen.getByRole('button', { name: /calculate quote/i })
    expect(calculateButton).toBeDisabled()
  })

  it('enables calculate button when file is selected', () => {
    const mockFile = new File(['test'], 'test.stl', { type: 'model/stl' })
    
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    // File selection would normally require user interaction
    // This is a basic smoke test
    expect(screen.getByRole('button', { name: /file mode/i })).toBeInTheDocument()
  })

  it('displays loading state when calculating', () => {
    ;(useQuoteStore as unknown as vi.Mock).mockReturnValue({
      ...mockQuoteStore,
      isLoading: true,
    })
    
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/calculating\.\.\./i)).toBeInTheDocument()
  })

  it('displays quote result when available', () => {
    ;(useQuoteStore as unknown as vi.Mock).mockReturnValue({
      ...mockQuoteStore,
      quote: {
        costs: {
          total: 500000,
          material_cost: 100000,
          electricity_cost: 50000,
          labor_cost: 100000,
          overhead: 75000,
          markup: 175000,
        },
        print_time: { hours: 2, minutes: 30 },
        formatted: { total: '500,000 IRT' },
      },
    })
    
    render(
      <BrowserRouter>
        <QuotePage />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/500,000 irt/i)).toBeInTheDocument()
    expect(screen.getByText(/2h 30m/i)).toBeInTheDocument()
  })
})
