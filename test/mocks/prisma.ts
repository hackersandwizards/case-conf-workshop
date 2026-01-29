import { vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
  default: prismaMock,
}));

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
