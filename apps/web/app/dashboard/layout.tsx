import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/features/dashboard/DashboardHeader"; 
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Server-side auth check for instant redirect (Performance)
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (Desktop) - Hidden on Mobile */}
      <DashboardSidebar />

      {/* Main Content Area - Offset by sidebar width on desktop */}
      <div className="md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header - Contains Mobile Menu Trigger & User Actions */}
        <DashboardHeader />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}