// components/AuthProvider.tsx

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Run the auth check once on initial load
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
}

