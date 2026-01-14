import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/v1/login/access-token/route'

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  authenticateUser: vi.fn(),
  createAccessToken: vi.fn(),
  excludePassword: vi.fn(),
}))

import { authenticateUser, createAccessToken, excludePassword } from '@/lib/auth'

describe('Login API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/login/access-token', () => {
    it('should authenticate with form-urlencoded data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hashed',
        fullName: 'Test User',
        isActive: true,
        isSuperuser: false,
      }
      vi.mocked(authenticateUser).mockResolvedValue(mockUser as any)
      vi.mocked(createAccessToken).mockReturnValue('test-token')
      vi.mocked(excludePassword).mockReturnValue({
        id: 'user-1',
        email: 'test@example.com',
        fullName: 'Test User',
        isActive: true,
        isSuperuser: false,
      } as any)

      const formData = new URLSearchParams()
      formData.append('username', 'test@example.com')
      formData.append('password', 'password123')

      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.access_token).toBe('test-token')
      expect(body.token_type).toBe('bearer')
      expect(body.user.email).toBe('test@example.com')
      expect(body.user).not.toHaveProperty('hashedPassword')
    })

    it('should authenticate with JSON body', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        hashedPassword: 'hashed',
      }
      vi.mocked(authenticateUser).mockResolvedValue(mockUser as any)
      vi.mocked(createAccessToken).mockReturnValue('test-token')
      vi.mocked(excludePassword).mockReturnValue({ id: 'user-1', email: 'test@example.com' } as any)

      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.access_token).toBe('test-token')
    })

    it('should accept username field in JSON body', async () => {
      vi.mocked(authenticateUser).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      } as any)
      vi.mocked(createAccessToken).mockReturnValue('test-token')
      vi.mocked(excludePassword).mockReturnValue({ id: 'user-1' } as any)

      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test@example.com', password: 'password123' }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(authenticateUser).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should return 400 if email is missing', async () => {
      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'password123' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email and password are required')
    })

    it('should return 400 if password is missing', async () => {
      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Email and password are required')
    })

    it('should return 400 for incorrect credentials', async () => {
      vi.mocked(authenticateUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.detail).toBe('Incorrect email or password')
    })

    it('should return 500 on server error', async () => {
      vi.mocked(authenticateUser).mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost/api/v1/login/access-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      })

      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.detail).toBe('Internal server error')
    })
  })
})
