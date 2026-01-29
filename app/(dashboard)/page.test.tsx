import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render, mockAuthenticated } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import DashboardPage from "./page";

vi.mock("@/lib/client/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { fullName: "Test User" },
    isLoading: false,
  })),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockAuthenticated();
  });

  it("displays loading skeleton while fetching contacts", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Total Contacts")).toBeInTheDocument();
  });

  it("displays contact count when loaded", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("displays zero when no contacts exist", async () => {
    server.use(
      http.get("/api/v1/contacts", () => {
        return HttpResponse.json({ data: [], count: 0 });
      })
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("displays personalized greeting with user name", () => {
    render(<DashboardPage />);

    expect(screen.getByText(/Welcome back, Test User!/)).toBeInTheDocument();
  });

  it("displays generic greeting when user has no name", async () => {
    const { useAuth } = await import("@/lib/client/useAuth");
    vi.mocked(useAuth).mockReturnValue({
      user: { fullName: null },
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Welcome back!")).toBeInTheDocument();
  });
});
