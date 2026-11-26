"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const LoadingContext = createContext(null);

/**
 * Counts in-flight requests. The shell renders a slim progress bar while
 * `isLoading` is true (no more "Fetching data..." toast on every request).
 */
export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => setLoadingCount((c) => c + 1), []);
  const stopLoading = useCallback(
    () => setLoadingCount((c) => Math.max(0, c - 1)),
    []
  );

  const value = useMemo(
    () => ({ startLoading, stopLoading, isLoading: loadingCount > 0 }),
    [startLoading, stopLoading, loadingCount]
  );

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return ctx;
};
