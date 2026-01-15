"use client"

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    console.log("loadingCount:", loadingCount);
  }, [loadingCount]);

  const isLoading = loadingCount > 0;

  useEffect(() => {
    if (loadingCount > 0) {
      toast.loading("Fetching data...", { id: "global-loading" });
    } else {
      toast.dismiss("global-loading");
    }
  }, [loadingCount]);

  const startLoading = () => setLoadingCount(c => c + 1);
  const stopLoading = () => setLoadingCount(c => Math.max(0, c - 1));

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }
  return ctx;
};