const API_BASE = "/api/v1";

export interface ApiError {
  detail: string;
}

export interface UserPublic {
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
  owner?: {
    id: string;
    email: string;
    fullName: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || "An error occurred");
  }
  return response.json();
}

// Auth API
export const AuthApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE}/login/access-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    return handleResponse<LoginResponse>(response);
  },

  async testToken(): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/login/test-token`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse<UserPublic>(response);
  },
};

// Users API
export const UsersApi = {
  async getMe(): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UserPublic>(response);
  },

  async updateMe(data: { email?: string; full_name?: string }): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<UserPublic>(response);
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    const response = await fetch(`${API_BASE}/users/me/password`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<void>(response);
  },

  async deleteMe(): Promise<void> {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  async signup(data: { email: string; password: string; full_name?: string }): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<UserPublic>(response);
  },

  async list(skip = 0, limit = 100): Promise<PaginatedResponse<UserPublic>> {
    const response = await fetch(`${API_BASE}/users?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<UserPublic>>(response);
  },

  async create(data: {
    email: string;
    password: string;
    full_name?: string;
    is_superuser?: boolean;
  }): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<UserPublic>(response);
  },

  async get(userId: string): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UserPublic>(response);
  },

  async update(
    userId: string,
    data: {
      email?: string;
      password?: string;
      full_name?: string;
      is_superuser?: boolean;
      is_active?: boolean;
    }
  ): Promise<UserPublic> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<UserPublic>(response);
  },

  async delete(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },
};

// Contacts API
export const ContactsApi = {
  async list(skip = 0, limit = 100, search = ""): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    const response = await fetch(`${API_BASE}/contacts?${params}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PaginatedResponse<Contact>>(response);
  },

  async create(data: { organisation: string; description?: string }): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Contact>(response);
  },

  async get(contactId: string): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Contact>(response);
  },

  async update(
    contactId: string,
    data: { organisation?: string; description?: string }
  ): Promise<Contact> {
    const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Contact>(response);
  },

  async delete(contactId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/contacts/${contactId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },
};
