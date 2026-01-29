import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  excludePassword,
} from "./auth";

describe("auth utilities", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "testPassword123";
      const hashed = await hashPassword(password);

      expect(hashed).not.toBe(password);
      expect(hashed).toHaveLength(60);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for matching password", async () => {
      const password = "testPassword123";
      const hashed = await hashPassword(password);

      const result = await verifyPassword(password, hashed);
      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const password = "testPassword123";
      const hashed = await hashPassword(password);

      const result = await verifyPassword("wrongPassword", hashed);
      expect(result).toBe(false);
    });
  });

  describe("createAccessToken", () => {
    it("should create a valid JWT token", () => {
      const userId = "user-123";
      const email = "test@example.com";

      const token = createAccessToken(userId, email);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify a valid token", () => {
      const userId = "user-123";
      const email = "test@example.com";
      const token = createAccessToken(userId, email);

      const payload = verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe(userId);
      expect(payload?.email).toBe(email);
    });

    it("should return null for invalid token", () => {
      const payload = verifyAccessToken("invalid-token");
      expect(payload).toBeNull();
    });

    it("should return null for malformed token", () => {
      const payload = verifyAccessToken("not.a.valid.jwt.token");
      expect(payload).toBeNull();
    });
  });

  describe("excludePassword", () => {
    it("should remove hashedPassword from user object", () => {
      const userWithPassword = {
        id: "user-123",
        email: "test@example.com",
        hashedPassword: "hashed-secret",
        fullName: "Test User",
        isActive: true,
        isSuperuser: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = excludePassword(userWithPassword);

      expect(result).not.toHaveProperty("hashedPassword");
      expect(result.id).toBe("user-123");
      expect(result.email).toBe("test@example.com");
      expect(result.fullName).toBe("Test User");
    });
  });
});
