"use client";

import { useEffect, Suspense } from "react";
import { useAuthStore } from "@/stores/authStore";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "@/components/ui/sonner"; // <-- toast system here

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <TooltipProvider delayDuration={0}>
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center">
                <LoadingSpinner />
              </div>
            }
          >
            <div className="contents">
              {children}
              {/* Global Toast Notifications */}
              <Toaster position="top-right" theme="dark" />
            </div>
          </Suspense>
        </TooltipProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

