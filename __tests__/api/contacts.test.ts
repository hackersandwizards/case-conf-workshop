import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/contacts/route'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    contact: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock auth utilities
vi.mock('@/lib/api-utils', async () => {
  const actual = await vi.importActual('@/lib/api-utils')
  return {
    ...actual,
    requireAuth: vi.fn(),
  }
})

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

describe('Contacts API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/contacts', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/contacts')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return contacts for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContacts = [
        { id: '1', organisation: 'Acme Corp', ownerId: 'user-1' },
        { id: '2', organisation: 'Tech Inc', ownerId: 'user-1' },
      ]
      vi.mocked(prisma.contact.findMany).mockResolvedValue(mockContacts as any)
      vi.mocked(prisma.contact.count).mockResolvedValue(2)

      const request = new NextRequest('http://localhost/api/v1/contacts')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toEqual(mockContacts)
      expect(body.count).toBe(2)

      // Verify non-superuser filter
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ownerId: 'user-1' },
        })
      )
    })

    it('should return all contacts for superuser', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContacts = [
        { id: '1', organisation: 'Acme Corp', ownerId: 'user-1' },
        { id: '2', organisation: 'Tech Inc', ownerId: 'user-2' },
      ]
      vi.mocked(prisma.contact.findMany).mockResolvedValue(mockContacts as any)
      vi.mocked(prisma.contact.count).mockResolvedValue(2)

      const request = new NextRequest('http://localhost/api/v1/contacts')
      const response = await GET(request)

      expect(response.status).toBe(200)

      // Verify superuser gets all (empty where clause)
      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })

    it('should handle pagination parameters', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findMany).mockResolvedValue([])
      vi.mocked(prisma.contact.count).mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/v1/contacts?skip=10&limit=5')
      await GET(request)

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/contacts')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/v1/contacts', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ organisation: 'Test' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create contact for authenticated user', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContact = {
        id: 'contact-1',
        organisation: 'New Corp',
        description: 'A new company',
        ownerId: 'user-1',
      }
      vi.mocked(prisma.contact.create).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ organisation: 'New Corp', description: 'A new company' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body).toEqual(mockContact)
      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            organisation: 'New Corp',
            description: 'A new company',
            ownerId: 'user-1',
          },
        })
      )
    })

    it('should return 400 if organisation is missing', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ description: 'No org' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Organisation is required')
    })

    it('should return 400 if organisation is too long', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const longOrg = 'a'.repeat(256)
      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ organisation: longOrg }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Organisation must be at most 255 characters')
    })

    it('should handle null description', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContact = { id: 'contact-1', organisation: 'Test', description: null }
      vi.mocked(prisma.contact.create).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ organisation: 'Test' }),
      })
      await POST(request)

      expect(prisma.contact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: null,
          }),
        })
      )
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.create).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/contacts', {
        method: 'POST',
        body: JSON.stringify({ organisation: 'Test' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
