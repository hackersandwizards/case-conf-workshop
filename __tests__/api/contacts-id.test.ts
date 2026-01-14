import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/v1/contacts/[contactId]/route'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

describe('Contacts [contactId] API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createParams = (contactId: string) => ({
    params: Promise.resolve({ contactId }),
  })

  describe('GET /api/v1/contacts/[contactId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1')
      const response = await GET(request, createParams('contact-1'))

      expect(response.status).toBe(401)
    })

    it('should return 404 if contact not found', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1')
      const response = await GET(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('Contact not found')
    })

    it('should return 403 if user is not owner and not superuser', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-2', // Different owner
        organisation: 'Test Corp',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1')
      const response = await GET(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe('Not enough permissions')
    })

    it('should return contact for owner', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContact = {
        id: 'contact-1',
        ownerId: 'user-1',
        organisation: 'Test Corp',
        owner: { id: 'user-1', email: 'test@example.com', fullName: 'Test User' },
      }
      vi.mocked(prisma.contact.findUnique).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1')
      const response = await GET(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual(mockContact)
    })

    it('should return contact for superuser even if not owner', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const mockContact = {
        id: 'contact-1',
        ownerId: 'user-2', // Different owner
        organisation: 'Test Corp',
      }
      vi.mocked(prisma.contact.findUnique).mockResolvedValue(mockContact as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1')
      const response = await GET(request, createParams('contact-1'))

      expect(response.status).toBe(200)
    })
  })

  describe('PUT /api/v1/contacts/[contactId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: 'Updated Corp' }),
      })
      const response = await PUT(request, createParams('contact-1'))

      expect(response.status).toBe(401)
    })

    it('should return 404 if contact not found', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: 'Updated Corp' }),
      })
      const response = await PUT(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('Contact not found')
    })

    it('should return 403 if user is not owner and not superuser', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-2',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: 'Updated Corp' }),
      })
      const response = await PUT(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe('Not enough permissions')
    })

    it('should return 400 if organisation is empty', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-1',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: '' }),
      })
      const response = await PUT(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Organisation cannot be empty')
    })

    it('should return 400 if organisation is too long', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-1',
      } as any)

      const longOrg = 'a'.repeat(256)
      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: longOrg }),
      })
      const response = await PUT(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Organisation must be at most 255 characters')
    })

    it('should update contact successfully', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-1',
      } as any)

      const updatedContact = {
        id: 'contact-1',
        ownerId: 'user-1',
        organisation: 'Updated Corp',
        description: 'New description',
      }
      vi.mocked(prisma.contact.update).mockResolvedValue(updatedContact as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ organisation: 'Updated Corp', description: 'New description' }),
      })
      const response = await PUT(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual(updatedContact)
      expect(prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'contact-1' },
          data: { organisation: 'Updated Corp', description: 'New description' },
        })
      )
    })

    it('should set description to null when empty', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-1',
      } as any)
      vi.mocked(prisma.contact.update).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'PUT',
        body: JSON.stringify({ description: '' }),
      })
      await PUT(request, createParams('contact-1'))

      expect(prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { description: null },
        })
      )
    })
  })

  describe('DELETE /api/v1/contacts/[contactId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('contact-1'))

      expect(response.status).toBe(401)
    })

    it('should return 404 if contact not found', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('Contact not found')
    })

    it('should return 403 if user is not owner and not superuser', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-2',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe('Not enough permissions')
    })

    it('should delete contact for owner', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-1',
      } as any)
      vi.mocked(prisma.contact.delete).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('contact-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.message).toBe('Contact deleted successfully')
      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: { id: 'contact-1' },
      })
    })

    it('should delete contact for superuser', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.contact.findUnique).mockResolvedValue({
        id: 'contact-1',
        ownerId: 'user-2',
      } as any)
      vi.mocked(prisma.contact.delete).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/v1/contacts/contact-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('contact-1'))

      expect(response.status).toBe(200)
    })
  })
})
