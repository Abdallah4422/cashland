// Cashland Phase 1 — Backend context
// Provides the useBackend hook to the entire app via React context.
// This avoids prop-drilling and ensures a single shared backend state.

import { createContext, useContext, type ReactNode } from 'react';
import { useBackend, type BackendState, type BackendActions } from './useBackend.js';

type BackendContextValue = BackendState & BackendActions;

const BackendContext = createContext<BackendContextValue | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const backend = useBackend();
  return (
    <BackendContext.Provider value={backend}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackendContext(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackendContext must be used within BackendProvider');
  return ctx;
}
