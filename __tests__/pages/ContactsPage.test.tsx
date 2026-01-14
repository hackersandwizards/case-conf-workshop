import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test-utils'
import ContactsPage from '@/app/(dashboard)/contacts/page'

// Mock the ContactsApi - data must be inline due to hoisting
vi.mock('@/lib/client/api', () => ({
  ContactsApi: {
    list: vi.fn().mockResolvedValue({
      data: [
        { id: '1', organisation: 'Acme Corp', description: 'Manufacturing company', ownerId: 'user-1' },
        { id: '2', organisation: 'Tech Solutions', description: 'Software development', ownerId: 'user-1' },
        { id: '3', organisation: 'Global Industries', description: 'Manufacturing and logistics', ownerId: 'user-1' },
        { id: '4', organisation: 'StartupXYZ', description: null, ownerId: 'user-1' },
      ],
      total: 4,
    }),
  },
}))

// Mock the dialog components to simplify tests
vi.mock('@/components/contacts/AddContactDialog', () => ({
  AddContactDialog: () => <button>Add Contact</button>,
}))

vi.mock('@/components/contacts/EditContactDialog', () => ({
  EditContactDialog: () => null,
}))

vi.mock('@/components/contacts/DeleteContactDialog', () => ({
  DeleteContactDialog: () => null,
}))

describe('ContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Search functionality', () => {
    it('renders search input', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search contacts...')).toBeTruthy()
      })
    })

    it('filters contacts by organisation name', async () => {
      render(<ContactsPage />)

      // Wait for contacts to load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'acme' } })

      // Should show Acme Corp, hide others
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
        expect(screen.queryByText('Tech Solutions')).toBeNull()
        expect(screen.queryByText('StartupXYZ')).toBeNull()
      })
    })

    it('filters contacts by description', async () => {
      render(<ContactsPage />)

      // Wait for contacts to load
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      // Search by description
      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'software' } })

      // Should show only Tech Solutions
      await waitFor(() => {
        expect(screen.getByText('Tech Solutions')).toBeTruthy()
        expect(screen.queryByText('Acme Corp')).toBeNull()
      })
    })

    it('filters case-insensitively', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'ACME' } })

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })
    })

    it('shows no results message when search has no matches', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent123' } })

      await waitFor(() => {
        expect(screen.getByText(/No contacts match/)).toBeTruthy()
      })
    })

    it('shows clear button when search has value', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      const searchInput = screen.getByPlaceholderText('Search contacts...')

      // No clear button initially
      expect(screen.queryByText('✕')).toBeNull()

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'test' } })

      // Clear button should appear
      await waitFor(() => {
        expect(screen.getByText('✕')).toBeTruthy()
      })
    })

    it('clears search when clear button is clicked', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'acme' } })

      // Wait for filter to apply
      await waitFor(() => {
        expect(screen.queryByText('Tech Solutions')).toBeNull()
      })

      // Click clear button
      const clearButton = screen.getByText('✕')
      fireEvent.click(clearButton)

      // All contacts should be visible again
      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
        expect(screen.getByText('Tech Solutions')).toBeTruthy()
      })

      // Search input should be empty
      expect(searchInput).toHaveValue('')
    })

    it('matches multiple contacts with shared terms', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
      })

      // Search for "Manufacturing" - should match Acme Corp and Global Industries
      const searchInput = screen.getByPlaceholderText('Search contacts...')
      fireEvent.change(searchInput, { target: { value: 'manufacturing' } })

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeTruthy()
        expect(screen.getByText('Global Industries')).toBeTruthy()
        expect(screen.queryByText('Tech Solutions')).toBeNull()
      })
    })
  })

  describe('Rendering', () => {
    it('renders page heading', async () => {
      render(<ContactsPage />)

      expect(screen.getByText('Contacts')).toBeTruthy()
    })

    it('renders loading skeletons while fetching', () => {
      render(<ContactsPage />)

      // Should show skeleton rows during loading
      const skeletons = document.querySelectorAll('[class*="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('renders contacts table after loading', async () => {
      render(<ContactsPage />)

      await waitFor(() => {
        expect(screen.getByText('Organisation')).toBeTruthy()
        expect(screen.getByText('Description')).toBeTruthy()
        expect(screen.getByText('Actions')).toBeTruthy()
      })
    })
  })
})
