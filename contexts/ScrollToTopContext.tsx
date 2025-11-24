import React, { createContext, useContext, useRef } from 'react';

interface ScrollToTopContextType {
  scrollToTop: (routeName: string) => void;
  registerScrollHandler: (routeName: string, handler: () => void) => void;
  unregisterScrollHandler: (routeName: string) => void;
}

const ScrollToTopContext = createContext<ScrollToTopContextType | undefined>(undefined);

export function ScrollToTopProvider({ children }: { children: React.ReactNode }) {
  const scrollHandlers = useRef<Map<string, () => void>>(new Map());

  const registerScrollHandler = (routeName: string, handler: () => void) => {
    scrollHandlers.current.set(routeName, handler);
  };

  const unregisterScrollHandler = (routeName: string) => {
    scrollHandlers.current.delete(routeName);
  };

  const scrollToTop = (routeName: string) => {
    const handler = scrollHandlers.current.get(routeName);
    if (handler) {
      handler();
    }
  };

  return (
    <ScrollToTopContext.Provider
      value={{ scrollToTop, registerScrollHandler, unregisterScrollHandler }}>
      {children}
    </ScrollToTopContext.Provider>
  );
}

export function useScrollToTop() {
  const context = useContext(ScrollToTopContext);
  if (!context) {
    throw new Error('useScrollToTop must be used within a ScrollToTopProvider');
  }
  return context;
}
