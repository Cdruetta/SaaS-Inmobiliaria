import { renderHook, waitFor } from '@testing-library/react'
import { useClients } from '../useClients'
import api from '../../services/api'

// Mock de la API
import { vi } from 'vitest'
vi.mock('../../services/api')
const mockApi = api

describe('useClients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    mockApi.get.mockResolvedValue({
      data: {
        clients: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      }
    })

    const { result } = renderHook(() => useClients())

    expect(result.current.clients).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.filters).toEqual({ search: '' })
  })

  it('should load clients on mount', async () => {
    const mockResponse = {
      data: {
        clients: [
          { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      }
    }

    mockApi.get.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockApi.get).toHaveBeenCalledWith('/clients?page=1&limit=10')
    expect(result.current.clients).toEqual(mockResponse.data.clients)
  })

  it('should handle API errors', async () => {
    mockApi.get.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useClients())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Error al cargar los clientes')
    expect(result.current.clients).toEqual([])
  })

  it('should update filters', () => {
    mockApi.get.mockResolvedValue({
      data: { clients: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
    })

    const { result } = renderHook(() => useClients())

    result.current.updateFilters({ search: 'test search' })

    expect(result.current.filters.search).toBe('test search')
  })

  it('should reset filters', () => {
    mockApi.get.mockResolvedValue({
      data: { clients: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }
    })

    const { result } = renderHook(() => useClients())

    result.current.updateFilters({ search: 'test search' })
    expect(result.current.filters.search).toBe('test search')

    result.current.resetFilters()
    expect(result.current.filters.search).toBe('')
  })
})