import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth"; // Assuming you have this server-side auth helper
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // 1. Server-Side Security Check (Zero CLS)
  // We check the session before rendering any UI to prevent "flashing" protected content
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background font-body selection:bg-primary/20">
      
      {/* 2. The Command Center Sidebar 
          Fixed to the left, full height. 
          Z-Index 50 ensures it floats above everything else.
      */}
      <DashboardSidebar />

      {/* 3. Main Content Area 
          - md:pl-72: Pushes content to the right to accommodate the expanded sidebar.
          - transition-all: Smoothly adapts if we change layout logic later.
      */}
      <div className="flex flex-col min-h-screen md:pl-72 transition-all duration-300 ease-in-out">
        
        {/* 4. Top Navigation 
            We inject the main Navbar here to handle User Profile & Settings.
            It sits sticky at the top of the content area.
        */}
        <div className="sticky top-0 z-40 w-full">
           <Navbar />
        </div>

        {/* 5. Page Content 
            - animate-fade-in: Every page transition feels smooth.
            - max-w-7xl: Prevents content from stretching too wide on ultrawide monitors.
        */}
        <main className="flex-1 p-4 md:p-8 pt-6">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}