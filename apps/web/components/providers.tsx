// components/providers.tsx
"use client";

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Get the auth check function from your store
  const { checkAuthStatus } = useAuthStore();

  // Run the authentication check only once when the application first loads
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          {children}
          <Toaster richColors />
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  );
}