const API_BASE_URL = process.env.CRM_API_URL || "http://localhost:3000";

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  isSuperuser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  organisation: string;
  description: string | null;
  ownerId: string;
  owner: {
    id: string;
    email: string;
    fullName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ContactsListResponse {
  data: Contact[];
  count: number;
}

export interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return data as T;
  }

  private authHeaders(token: string): HeadersInit {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/v1/login/access-token", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyToken(token: string): Promise<User> {
    return this.request<User>("/api/v1/login/test-token", {
      method: "POST",
      headers: this.authHeaders(token),
    });
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.request<User>("/api/v1/users/me", {
      method: "GET",
      headers: this.authHeaders(token),
    });
  }

  async listContacts(
    token: string,
    skip?: number,
    limit?: number
  ): Promise<ContactsListResponse> {
    const params = new URLSearchParams();
    if (skip !== undefined) params.set("skip", String(skip));
    if (limit !== undefined) params.set("limit", String(limit));

    const query = params.toString();
    const path = `/api/v1/contacts${query ? `?${query}` : ""}`;

    return this.request<ContactsListResponse>(path, {
      method: "GET",
      headers: this.authHeaders(token),
    });
  }

  async getContact(token: string, contactId: string): Promise<Contact> {
    return this.request<Contact>(`/api/v1/contacts/${contactId}`, {
      method: "GET",
      headers: this.authHeaders(token),
    });
  }

  async createContact(
    token: string,
    data: { organisation: string; description?: string }
  ): Promise<Contact> {
    return this.request<Contact>("/api/v1/contacts", {
      method: "POST",
      headers: this.authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async updateContact(
    token: string,
    contactId: string,
    data: { organisation?: string; description?: string }
  ): Promise<Contact> {
    return this.request<Contact>(`/api/v1/contacts/${contactId}`, {
      method: "PUT",
      headers: this.authHeaders(token),
      body: JSON.stringify(data),
    });
  }

  async deleteContact(
    token: string,
    contactId: string
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/contacts/${contactId}`,
      {
        method: "DELETE",
        headers: this.authHeaders(token),
      }
    );
  }
}

export const apiClient = new ApiClient();
export default apiClient;
