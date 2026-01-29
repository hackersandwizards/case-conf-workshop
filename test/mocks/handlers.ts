import { http, HttpResponse } from "msw";

const API_BASE = "/api/v1";

export const mockUser = {
  id: "user-1",
  email: "test@example.com",
  fullName: "Test User",
  isActive: true,
  isSuperuser: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockContact = {
  id: "contact-1",
  organisation: "Test Corp",
  description: "Test description",
  ownerId: "user-1",
  owner: {
    id: "user-1",
    email: "test@example.com",
    fullName: "Test User",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const handlers = [
  http.post(`${API_BASE}/login/access-token`, async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("username");
    const password = formData.get("password");

    if (email === "test@example.com" && password === "password123") {
      return HttpResponse.json({
        access_token: "mock-jwt-token",
        token_type: "bearer",
        user: mockUser,
      });
    }

    return HttpResponse.json(
      { detail: "Incorrect email or password" },
      { status: 400 }
    );
  }),

  http.get(`${API_BASE}/users/me`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
    return HttpResponse.json(mockUser);
  }),

  http.get(`${API_BASE}/contacts`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }
    return HttpResponse.json({
      data: [mockContact],
      count: 1,
    });
  }),

  http.post(`${API_BASE}/contacts`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return HttpResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const body = (await request.json()) as {
      organisation: string;
      description?: string;
    };

    if (!body.organisation) {
      return HttpResponse.json(
        { detail: "Organisation is required" },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      {
        ...mockContact,
        id: `contact-${Date.now()}`,
        organisation: body.organisation,
        description: body.description || null,
      },
      { status: 201 }
    );
  }),
];
