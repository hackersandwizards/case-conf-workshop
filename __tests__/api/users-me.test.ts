import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/v1/users/me/route'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  excludePassword: vi.fn((user) => {
    const { hashedPassword, ...rest } = user
    return rest
  }),
}))

// Mock api-utils
vi.mock('@/lib/api-utils', async () => {
  const actual = await vi.importActual('@/lib/api-utils')
  return {
    ...actual,
    requireAuth: vi.fn(),
  }
})

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

describe('Users Me API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/me')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return current user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'Test User',
        hashedPassword: 'secret',
        isActive: true,
        isSuperuser: false,
      }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users/me')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.email).toBe('user@example.com')
      expect(body).not.toHaveProperty('hashedPassword')
    })
  })

  describe('PATCH /api/v1/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for invalid email format', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'invalid-email' }),
      })
      const response = await PATCH(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Invalid email format')
    })

    it('should return 400 if email already taken', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'other-user' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'taken@example.com' }),
      })
      const response = await PATCH(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email already registered')
    })

    it('should allow keeping same email', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', hashedPassword: 'hash' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.update).mockResolvedValue({ ...mockUser, fullName: 'New Name' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'user@example.com', full_name: 'New Name' }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(200)
      // Should not check for existing user when email hasn't changed
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should update user name', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', hashedPassword: 'hash' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        fullName: 'Updated Name',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'Updated Name' }),
      })
      const response = await PATCH(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { fullName: 'Updated Name' },
        })
      )
    })

    it('should update user email', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', hashedPassword: 'hash' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        email: 'new@example.com',
      } as any)

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'new@example.com' }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(200)
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { email: 'new@example.com' },
        })
      )
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.update).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'Test' }),
      })
      const response = await PATCH(request)

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /api/v1/users/me', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'DELETE',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 if superuser tries to delete themselves', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'DELETE',
      })
      const response = await DELETE(request)
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe('Super users are not allowed to delete themselves')
    })

    it('should delete regular user', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'DELETE',
      })
      const response = await DELETE(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.message).toBe('User deleted successfully')
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      })
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/users/me', {
        method: 'DELETE',
      })
      const response = await DELETE(request)

      expect(response.status).toBe(500)
    })
  })
})
