import { useRef, useCallback } from 'react';

const LOCK_DURATION_MS = 500;

/**
 * Hook to prevent double-tap navigation issues.
 * Wraps a callback and prevents it from being called again within the lock duration.
 */
export function useNavigationLock() {
  const isLockedRef = useRef(false);

  const withLock = useCallback(<T extends (...args: unknown[]) => void>(callback: T) => {
    return (...args: Parameters<T>) => {
      if (isLockedRef.current) {
        return;
      }

      isLockedRef.current = true;
      callback(...args);

      setTimeout(() => {
        isLockedRef.current = false;
      }, LOCK_DURATION_MS);
    };
  }, []);

  return { withLock };
}

/**
 * Simple lock function for use outside of React components.
 * Uses a module-level lock to prevent rapid navigation calls.
 */
let globalNavigationLocked = false;

export function withNavigationLock<T extends (...args: unknown[]) => void>(callback: T) {
  return (...args: Parameters<T>) => {
    if (globalNavigationLocked) {
      return;
    }

    globalNavigationLocked = true;
    callback(...args);

    setTimeout(() => {
      globalNavigationLocked = false;
    }, LOCK_DURATION_MS);
  };
}
