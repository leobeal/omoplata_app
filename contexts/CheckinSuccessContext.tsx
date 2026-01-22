import React, { createContext, useContext, useState, useCallback } from 'react';

import { CheckinData, NoClassesAvailableData } from '@/api';

export type CheckinResultType = 'success' | 'no_classes' | 'error';

export interface CheckinResult {
  type: CheckinResultType;
  data?: CheckinData;
  noClassesData?: NoClassesAvailableData;
  errorMessage?: string;
}

interface CheckinResultContextType {
  result: CheckinResult | null;
  showSuccess: (data: CheckinData) => void;
  showNoClasses: (data: NoClassesAvailableData) => void;
  showError: (message: string) => void;
  hide: () => void;
}

const CheckinResultContext = createContext<CheckinResultContextType | undefined>(undefined);

export function CheckinSuccessProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<CheckinResult | null>(null);

  const showSuccess = useCallback((data: CheckinData) => {
    setResult({ type: 'success', data });
  }, []);

  const showNoClasses = useCallback((data: NoClassesAvailableData) => {
    setResult({ type: 'no_classes', noClassesData: data });
  }, []);

  const showError = useCallback((message: string) => {
    setResult({ type: 'error', errorMessage: message });
  }, []);

  const hide = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <CheckinResultContext.Provider value={{ result, showSuccess, showNoClasses, showError, hide }}>
      {children}
    </CheckinResultContext.Provider>
  );
}

export function useCheckinResult() {
  const context = useContext(CheckinResultContext);
  if (context === undefined) {
    throw new Error('useCheckinResult must be used within a CheckinSuccessProvider');
  }
  return context;
}

// Alias for backwards compatibility
export const useCheckinSuccess = useCheckinResult;
