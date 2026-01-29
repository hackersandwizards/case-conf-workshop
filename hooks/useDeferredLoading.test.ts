import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeferredLoading } from "./useDeferredLoading";

describe("useDeferredLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false initially even when isLoading is true", () => {
    const { result } = renderHook(() => useDeferredLoading(true, 200));
    expect(result.current).toBe(false);
  });

  it("returns true after delay when isLoading remains true", () => {
    const { result } = renderHook(() => useDeferredLoading(true, 200));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe(true);
  });

  it("returns false when isLoading becomes false before delay", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDeferredLoading(isLoading, 200),
      { initialProps: { isLoading: true } }
    );

    expect(result.current).toBe(false);

    // Loading completes before delay
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ isLoading: false });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be false - never showed loading
    expect(result.current).toBe(false);
  });

  it("returns false immediately when isLoading is false", () => {
    const { result } = renderHook(() => useDeferredLoading(false, 200));
    expect(result.current).toBe(false);
  });

  it("resets when isLoading changes from true to false", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDeferredLoading(isLoading, 200),
      { initialProps: { isLoading: true } }
    );

    // Wait for deferred loading to become true
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(true);

    // Loading completes
    rerender({ isLoading: false });
    expect(result.current).toBe(false);
  });

  it("uses custom delay", () => {
    const { result } = renderHook(() => useDeferredLoading(true, 500));

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it("handles rapid loading state changes without flicker", () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useDeferredLoading(isLoading, 200),
      { initialProps: { isLoading: false } }
    );

    // Start loading
    rerender({ isLoading: true });
    expect(result.current).toBe(false);

    // Quick response (50ms)
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ isLoading: false });

    // Start loading again
    rerender({ isLoading: true });
    expect(result.current).toBe(false);

    // Another quick response
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ isLoading: false });

    // Should never have shown loading
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe(false);
  });
});
