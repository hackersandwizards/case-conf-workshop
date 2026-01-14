import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '@/app/api/v1/users/[userId]/route'

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
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
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
    requireSuperuser: vi.fn(),
  }
})

import { prisma } from '@/lib/db'
import { requireAuth, requireSuperuser } from '@/lib/api-utils'
import { hashPassword } from '@/lib/auth'

describe('Users [userId] API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createParams = (userId: string) => ({
    params: Promise.resolve({ userId }),
  })

  describe('GET /api/v1/users/[userId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAuth).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/user-1')
      const response = await GET(request, createParams('user-1'))

      expect(response.status).toBe(401)
    })

    it('should return 403 if user tries to access another user without being superuser', async () => {
      const mockUser = { id: 'user-1', isSuperuser: false }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users/user-2')
      const response = await GET(request, createParams('user-2'))
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe("The user doesn't have enough privileges")
    })

    it('should allow user to get their own info', async () => {
      const mockUser = { id: 'user-1', email: 'user@example.com', isSuperuser: false, hashedPassword: 'hash' }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1')
      const response = await GET(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.email).toBe('user@example.com')
      expect(body).not.toHaveProperty('hashedPassword')
    })

    it('should allow superuser to get any user', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockAdmin as any })

      const targetUser = { id: 'user-2', email: 'user2@example.com', hashedPassword: 'hash' }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(targetUser as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-2')
      const response = await GET(request, createParams('user-2'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.email).toBe('user2@example.com')
    })

    it('should return 404 if user not found', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireAuth).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/users/nonexistent')
      const response = await GET(request, createParams('nonexistent'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('User not found')
    })
  })

  describe('PATCH /api/v1/users/[userId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      })
      const response = await PATCH(request, createParams('user-1'))

      expect(response.status).toBe(401)
    })

    it('should return 403 if not superuser', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not enough privileges' }), {
          status: 403,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      })
      const response = await PATCH(request, createParams('user-1'))

      expect(response.status).toBe(403)
    })

    it('should return 404 if user not found', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'New Name' }),
      })
      const response = await PATCH(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('User not found')
    })

    it('should return 400 for invalid email format', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1', email: 'old@example.com' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'invalid-email' }),
      })
      const response = await PATCH(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Invalid email format')
    })

    it('should return 400 if email already taken', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({ id: 'user-1', email: 'old@example.com' } as any)
        .mockResolvedValueOnce({ id: 'other-user' } as any) // Email already taken

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ email: 'taken@example.com' }),
      })
      const response = await PATCH(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email already registered')
    })

    it('should return 400 for weak password', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ password: '123' }),
      })
      const response = await PATCH(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toContain('Password')
    })

    it('should update user successfully', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1', email: 'user@example.com' } as any)

      const updatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        fullName: 'Updated Name',
        hashedPassword: 'hash',
      }
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: 'Updated Name' }),
      })
      const response = await PATCH(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.fullName).toBe('Updated Name')
      expect(body).not.toHaveProperty('hashedPassword')
    })

    it('should update password with hashing', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1' } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user-1', hashedPassword: 'new-hash' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ password: 'NewPassword123' }),
      })
      await PATCH(request, createParams('user-1'))

      expect(hashPassword).toHaveBeenCalledWith('NewPassword123')
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hashedPassword: 'hashed-password',
          }),
        })
      )
    })

    it('should update superuser and active status', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'user-1' } as any)
      vi.mocked(prisma.user.update).mockResolvedValue({ id: 'user-1', hashedPassword: 'hash' } as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ is_superuser: true, is_active: false }),
      })
      await PATCH(request, createParams('user-1'))

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isSuperuser: true,
            isActive: false,
          }),
        })
      )
    })
  })

  describe('DELETE /api/v1/users/[userId]', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('user-1'))

      expect(response.status).toBe(401)
    })

    it('should return 403 if superuser tries to delete themselves', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })

      const request = new NextRequest('http://localhost/api/v1/users/admin-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('admin-1'))
      const body = await response.json()

      expect(response.status).toBe(403)
      expect(body.detail).toBe('Super users are not allowed to delete themselves')
    })

    it('should return 404 if user not found', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.detail).toBe('User not found')
    })

    it('should delete user successfully', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any)
      vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('user-1'))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.message).toBe('User deleted successfully')
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      })
    })

    it('should return 500 on database error', async () => {
      const mockAdmin = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockAdmin as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user-1' } as any)
      vi.mocked(prisma.user.delete).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/users/user-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, createParams('user-1'))

      expect(response.status).toBe(500)
    })
  })
})
