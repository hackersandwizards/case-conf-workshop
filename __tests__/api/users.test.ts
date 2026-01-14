import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/users/route'

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
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
    requireSuperuser: vi.fn(),
  }
})

import { prisma } from '@/lib/db'
import { requireSuperuser } from '@/lib/api-utils'
import { hashPassword } from '@/lib/auth'

describe('Users API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/users', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 if not superuser', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not enough privileges' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users')
      const response = await GET(request)

      expect(response.status).toBe(403)
    })

    it('should return users list for superuser', async () => {
      const mockUser = { id: 'admin-1', email: 'admin@example.com', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })

      const mockUsers = [
        { id: '1', email: 'user1@example.com', hashedPassword: 'hash1' },
        { id: '2', email: 'user2@example.com', hashedPassword: 'hash2' },
      ]
      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
      vi.mocked(prisma.user.count).mockResolvedValue(2)

      const request = new NextRequest('http://localhost/api/v1/users')
      const response = await GET(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data).toHaveLength(2)
      expect(body.count).toBe(2)
      // Verify passwords are excluded
      expect(body.data[0]).not.toHaveProperty('hashedPassword')
    })

    it('should handle pagination', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findMany).mockResolvedValue([])
      vi.mocked(prisma.user.count).mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/v1/users?skip=10&limit=5')
      await GET(request)

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 5,
        })
      )
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findMany).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/users')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/v1/users', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireSuperuser).mockResolvedValue({
        error: new Response(JSON.stringify({ detail: 'Not authenticated' }), {
          status: 401,
        }) as any,
      })

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com', password: 'Password123' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 if email is missing', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ password: 'Password123' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email and password are required')
    })

    it('should return 400 if password is missing', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email and password are required')
    })

    it('should return 400 for invalid email format', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email', password: 'Password123' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Invalid email format')
    })

    it('should return 400 for weak password', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com', password: '123' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toContain('Password')
    })

    it('should return 400 if user already exists', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing' } as any)

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'existing@example.com', password: 'Password123' }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('The user with this email already exists')
    })

    it('should create user successfully', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const newUser = {
        id: 'new-user-1',
        email: 'new@example.com',
        hashedPassword: 'hashed-password',
        fullName: 'New User',
        isActive: true,
        isSuperuser: false,
      }
      vi.mocked(prisma.user.create).mockResolvedValue(newUser as any)

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'new@example.com',
          password: 'Password123',
          full_name: 'New User',
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(201)
      expect(body.email).toBe('new@example.com')
      expect(body).not.toHaveProperty('hashedPassword')
      expect(hashPassword).toHaveBeenCalledWith('Password123')
    })

    it('should create superuser when is_superuser is true', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: '1', hashedPassword: 'hash' } as any)

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin2@example.com',
          password: 'Password123',
          is_superuser: true,
        }),
      })
      await POST(request)

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isSuperuser: true,
          }),
        })
      )
    })

    it('should return 500 on database error', async () => {
      const mockUser = { id: 'admin-1', isSuperuser: true }
      vi.mocked(requireSuperuser).mockResolvedValue({ user: mockUser as any })
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({ email: 'new@example.com', password: 'Password123' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })
})
