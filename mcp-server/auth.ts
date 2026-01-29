import { apiClient, type User, type LoginResponse } from "./api-client.js";

export type { User, LoginResponse };

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  return apiClient.login(email, password);
}

export async function verifyToken(token: string): Promise<User> {
  return apiClient.verifyToken(token);
}

export async function getCurrentUser(token: string): Promise<User> {
  return apiClient.getCurrentUser(token);
}
