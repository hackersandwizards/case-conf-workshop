import { useState, useEffect } from "react";

/**
 * Returns a deferred loading state that only becomes true after a delay.
 * This prevents flickering when loading states are very brief.
 *
 * @param isLoading - The actual loading state
 * @param delay - Delay in ms before showing loading indicator (default: 200ms)
 * @returns Deferred loading state - only true if isLoading has been true for longer than delay
 */
export function useDeferredLoading(isLoading: boolean, delay = 200): boolean {
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      // Loading ended - reset immediately
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDelayElapsed(false);
      return;
    }

    // Loading started - reset and start timer
    setDelayElapsed(false);

    const timer = setTimeout(() => {
      setDelayElapsed(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return delayElapsed;
}
