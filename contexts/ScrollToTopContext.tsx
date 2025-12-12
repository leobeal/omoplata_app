import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

interface ScrollToTopContextType {
  scrollToTop: (routeName: string) => void;
  registerScrollHandler: (routeName: string, handler: () => void) => void;
  unregisterScrollHandler: (routeName: string) => void;
}

const ScrollToTopContext = createContext<ScrollToTopContextType | undefined>(undefined);

export function ScrollToTopProvider({ children }: { children: React.ReactNode }) {
  const scrollHandlers = useRef<Map<string, () => void>>(new Map());

  const registerScrollHandler = useCallback((routeName: string, handler: () => void) => {
    scrollHandlers.current.set(routeName, handler);
  }, []);

  const unregisterScrollHandler = useCallback((routeName: string) => {
    scrollHandlers.current.delete(routeName);
  }, []);

  const scrollToTop = useCallback((routeName: string) => {
    const handler = scrollHandlers.current.get(routeName);
    if (handler) {
      handler();
    }
  }, []);

  const value = useMemo(
    () => ({ scrollToTop, registerScrollHandler, unregisterScrollHandler }),
    [scrollToTop, registerScrollHandler, unregisterScrollHandler]
  );

  return <ScrollToTopContext.Provider value={value}>{children}</ScrollToTopContext.Provider>;
}

export function useScrollToTop() {
  const context = useContext(ScrollToTopContext);
  if (!context) {
    throw new Error('useScrollToTop must be used within a ScrollToTopProvider');
  }
  return context;
}
