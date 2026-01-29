import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render, mockAuthenticated } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import ContactsPage from "./page";

const API_BASE = "/api/v1";

describe("ContactsPage Search", () => {
  beforeEach(() => {
    mockAuthenticated();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockContacts = [
    {
      id: "1",
      organisation: "Acme Corp",
      description: "Main client for widgets",
      ownerId: "user-1",
      owner: { id: "user-1", email: "test@example.com", fullName: "Test" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      organisation: "Tech Inc",
      description: "Technology partner",
      ownerId: "user-1",
      owner: { id: "user-1", email: "test@example.com", fullName: "Test" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      organisation: "Acme Labs",
      description: "Research division",
      ownerId: "user-1",
      owner: { id: "user-1", email: "test@example.com", fullName: "Test" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe("search input rendering", () => {
    it("renders search input with placeholder", async () => {
      server.use(
        http.get(`${API_BASE}/contacts`, () => {
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("search input is initially empty", async () => {
      server.use(
        http.get(`${API_BASE}/contacts`, () => {
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      expect(searchInput).toHaveValue("");
    });
  });

  describe("search behavior", () => {
    it("debounces search input (does not call API immediately)", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      let apiCallCount = 0;

      server.use(
        http.get(`${API_BASE}/contacts`, () => {
          apiCallCount++;
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);
      const initialCallCount = apiCallCount;

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");

      // API should not be called yet (within debounce window)
      expect(apiCallCount).toBe(initialCallCount);
    });

    it("calls API with search parameter after debounce delay", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      let capturedSearch = "";

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          capturedSearch = url.searchParams.get("search") || "";
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => expect(capturedSearch).toBe("acme"));
    });

    it("resets to page 0 when search term changes", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      let capturedSkip = 0;

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          capturedSkip = parseInt(url.searchParams.get("skip") || "0");
          return HttpResponse.json({
            data: mockContacts,
            count: 20,
          });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      // Wait for initial render with pagination
      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 4/i)).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByText("Next");
      await user.click(nextButton);
      await vi.advanceTimersByTimeAsync(100);

      await waitFor(() => expect(capturedSkip).toBe(5));

      // Type search
      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => expect(capturedSkip).toBe(0));
    });
  });

  describe("search results display", () => {
    it("displays filtered results after search", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search === "acme") {
            const filtered = mockContacts.filter((c) =>
              c.organisation.toLowerCase().includes("acme")
            );
            return HttpResponse.json({ data: filtered, count: filtered.length });
          }
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      // Initially shows all contacts
      await waitFor(() => {
        expect(screen.getByText("Tech Inc")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Acme Labs")).toBeInTheDocument();
        expect(screen.queryByText("Tech Inc")).not.toBeInTheDocument();
      });
    });

    it("displays empty state message when no results match", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search) {
            return HttpResponse.json({ data: [], count: 0 });
          }
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "nonexistent");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
      });
    });

    it("shows different empty message for search vs no contacts", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, () => {
          return HttpResponse.json({ data: [], count: 0 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      // Without search - show "Add your first contact"
      await waitFor(() => {
        expect(
          screen.getByText(/add your first contact/i)
        ).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "test");
      await vi.advanceTimersByTimeAsync(300);

      // With search - show "No contacts found"
      await waitFor(() => {
        expect(screen.getByText(/no contacts found/i)).toBeInTheDocument();
      });
    });
  });

  describe("search with pagination", () => {
    it("hides pagination when filtered results fit on one page", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search === "acme") {
            return HttpResponse.json({
              data: [mockContacts[0]],
              count: 1,
            });
          }
          return HttpResponse.json({ data: mockContacts, count: 12 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      // Initially shows pagination (12 > PAGE_SIZE of 5)
      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");
      await vi.advanceTimersByTimeAsync(300);

      // After search, pagination should be hidden (1 result < PAGE_SIZE)
      await waitFor(() => {
        expect(screen.queryByText(/Page/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("clearing search", () => {
    it("clears search and shows all contacts when input cleared", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search === "acme") {
            return HttpResponse.json({
              data: [mockContacts[0]],
              count: 1,
            });
          }
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "acme");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.queryByText("Tech Inc")).not.toBeInTheDocument();
      });

      await user.clear(searchInput);
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText("Tech Inc")).toBeInTheDocument();
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
      });
    });
  });

  describe("search by description", () => {
    it("finds contacts matching description text", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search === "partner") {
            const filtered = mockContacts.filter((c) =>
              c.description?.toLowerCase().includes("partner")
            );
            return HttpResponse.json({ data: filtered, count: filtered.length });
          }
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "partner");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText("Tech Inc")).toBeInTheDocument();
        expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument();
      });
    });
  });

  describe("case-insensitive search", () => {
    it("finds contacts regardless of case", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      server.use(
        http.get(`${API_BASE}/contacts`, ({ request }) => {
          const url = new URL(request.url);
          const search = url.searchParams.get("search") || "";
          if (search) {
            // Simulate case-insensitive search (as backend does)
            const filtered = mockContacts.filter(
              (c) =>
                c.organisation.toLowerCase().includes(search.toLowerCase()) ||
                (c.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
            );
            return HttpResponse.json({ data: filtered, count: filtered.length });
          }
          return HttpResponse.json({ data: mockContacts, count: 3 });
        })
      );

      render(<ContactsPage />);
      await vi.advanceTimersByTimeAsync(100);

      // Search with uppercase "ACME" should find "Acme Corp" and "Acme Labs"
      const searchInput = screen.getByPlaceholderText(/search contacts/i);
      await user.type(searchInput, "ACME");
      await vi.advanceTimersByTimeAsync(300);

      await waitFor(() => {
        expect(screen.getByText("Acme Corp")).toBeInTheDocument();
        expect(screen.getByText("Acme Labs")).toBeInTheDocument();
        expect(screen.queryByText("Tech Inc")).not.toBeInTheDocument();
      });
    });
  });
});