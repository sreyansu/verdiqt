"use client";

import { useEffect, useCallback } from "react";
import api from "./api";
import { auth } from "./firebase";

/**
 * Hook to sync Firebase auth token with Axios instance.
 * Call this in your root dashboard layout or components.
 */
export function useAuthenticatedApi() {
  const refreshToken = useCallback(async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    refreshToken();

    // Add request interceptor to always get fresh token before any request goes out
    const interceptor = api.interceptors.request.use(async (config) => {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [refreshToken]);

  return api;
}
