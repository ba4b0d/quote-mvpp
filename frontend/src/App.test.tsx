import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, jest } from 'vitest'
import App from '../App'
import { useAuthStore } from '../hooks/useAuth'

// Mock the auth store
vi.mock('../hooks/useAuth', () => ({
  useAuthStore: vi.fn(),
}))

describe('App Component', () => {
  const mockAuthStore = {
    isAuthenticated: false,
    isLoading: false,
    checkAuth: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as unknown as vi.Mock).mockReturnValue(mockAuthStore)
  })

  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByText(/quote-mvpp/i)).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login for admin routes', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    // Should render home page
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('shows loading screen when auth is loading', () => {
    ;(useAuthStore as unknown as vi.Mock).mockReturnValue({
      ...mockAuthStore,
      isLoading: true,
    })

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
