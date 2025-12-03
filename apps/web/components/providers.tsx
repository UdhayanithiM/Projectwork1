"use client";

import { useEffect, Suspense } from "react";
import { useAuthStore } from "@/stores/authStore";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <TooltipProvider delayDuration={100}>
          <Suspense
            fallback={
              <div className="flex h-screen w-full items-center justify-center bg-background">
                <LoadingSpinner className="h-8 w-8 text-primary animate-pulse" />
              </div>
            }
          >
            <div className="contents">
              {children}

              <Toaster
                position="top-center"
                theme="dark"
                toastOptions={{
                  classNames: {
                    toast:
                      "bg-background/80 backdrop-blur-xl border border-border text-foreground shadow-glow-soft",
                    title: "text-primary font-bold font-heading",
                    description: "text-muted-foreground",
                    actionButton:
                      "bg-primary text-primary-foreground font-medium",
                    cancelButton: "bg-muted text-muted-foreground",
                  },
                }}
              />
            </div>
          </Suspense>
        </TooltipProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
