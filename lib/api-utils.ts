import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "./auth";
import type { User } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorResponse(
  statusCode: number,
  message: string
): NextResponse {
  return NextResponse.json({ detail: message }, { status: statusCode });
}

export function successResponse<T>(data: T, statusCode = 200): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<User | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return getCurrentUser(token);
}

export async function requireAuth(
  request: NextRequest
): Promise<{ user: User } | { error: NextResponse }> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { error: errorResponse(401, "Not authenticated") };
  }
  return { user };
}

export async function requireSuperuser(
  request: NextRequest
): Promise<{ user: User } | { error: NextResponse }> {
  const result = await requireAuth(request);
  if ("error" in result) {
    return result;
  }
  if (!result.user.isSuperuser) {
    return { error: errorResponse(403, "The user doesn't have enough privileges") };
  }
  return result;
}

export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skip = parseInt(searchParams.get("skip") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const search = searchParams.get("search") || "";
  return { skip, limit: Math.min(limit, 100), search };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 40) {
    return "Password must be at most 40 characters";
  }
  return null;
}
