import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SupportPanel from '../components/organisms/SupportPanel'
import { api } from '../lib/api'

// Mock the API module
vi.mock('../lib/api')
const mockApi = vi.mocked(api)

describe('SupportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders support button initially', () => {
    render(<SupportPanel />)
    
    const supportButton = screen.getByLabelText('Open support panel')
    expect(supportButton).toBeInTheDocument()
  })

  it('opens panel when support button is clicked', () => {
    render(<SupportPanel />)
    
    const supportButton = screen.getByLabelText('Open support panel')
    fireEvent.click(supportButton)
    
    expect(screen.getByText('AI Support')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask a question or enter your order ID...')).toBeInTheDocument()
  })

  it('closes panel when close button is clicked', () => {
    render(<SupportPanel />)
    
    // Open panel
    const supportButton = screen.getByLabelText('Open support panel')
    fireEvent.click(supportButton)
    
    // Close panel
    const closeButton = screen.getByLabelText('Close support panel')
    fireEvent.click(closeButton)
    
    expect(screen.queryByText('Ask Support')).not.toBeInTheDocument()
  })

  it('submits question and displays response', async () => {
    mockApi.sendAssistantMessage.mockResolvedValue({
      response: 'Test answer',
      intent: 'chitchat',
      confidence: 0.8
    })

    render(<SupportPanel />)
    
    // Open panel
    const supportButton = screen.getByLabelText('Open support panel')
    fireEvent.click(supportButton)
    
    // Enter question
    const textarea = screen.getByPlaceholderText('Ask a question or enter your order ID...')
    fireEvent.change(textarea, { target: { value: 'Test question' } })
    
    // Submit
    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockApi.sendAssistantMessage).toHaveBeenCalledWith('Test question')
      expect(screen.getByText('Test answer')).toBeInTheDocument()
    })
  })

  it('handles API errors', async () => {
    mockApi.sendAssistantMessage.mockRejectedValue(new Error('API Error'))

    render(<SupportPanel />)
    
    // Open panel
    const supportButton = screen.getByLabelText('Open support panel')
    fireEvent.click(supportButton)
    
    // Enter question
    const textarea = screen.getByPlaceholderText('Ask a question or enter your order ID...')
    fireEvent.change(textarea, { target: { value: 'Test question' } })
    
    // Submit
    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    mockApi.sendAssistantMessage.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ response: 'Test answer' }), 100)
    ))

    render(<SupportPanel />)
    
    // Open panel
    const supportButton = screen.getByLabelText('Open support panel')
    fireEvent.click(supportButton)
    
    // Enter question
    const textarea = screen.getByPlaceholderText('Ask a question or enter your order ID...')
    fireEvent.change(textarea, { target: { value: 'Test question' } })
    
    // Submit
    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)
    
    expect(screen.getByText('Sending...')).toBeInTheDocument()
    expect(sendButton).toBeDisabled()
  })
})
