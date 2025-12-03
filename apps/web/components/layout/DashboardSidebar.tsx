"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Video, 
  FileCode, 
  Award, 
  Settings, 
  LogOut, 
  Gauge,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/authStore";

const sidebarItems = [
  { icon: LayoutGrid, label: "Dashboard", href: "/dashboard" },
  { icon: Video, label: "Interviews", href: "/dashboard/interviews" },
  { icon: FileCode, label: "Assessments", href: "/technical-assessment" }, 
  { icon: Award, label: "Achievements", href: "/dashboard/achievements" }, 
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col fixed inset-y-0 z-40 transition-all duration-300 ease-in-out border-r",
        // Deep Void Styling using our custom sidebar tokens
        "bg-sidebar border-sidebar-border backdrop-blur-xl",
        isCollapsed ? "w-20" : "w-72"
      )}
    >
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border relative">
        <Link 
          href="/dashboard" 
          className={cn(
            "flex items-center gap-3 transition-opacity duration-200",
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight whitespace-nowrap">
            <span className="text-primary">Forti</span>Twin
          </span>
        </Link>

        {/* Collapsed Logo Fallback */}
        {isCollapsed && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <Gauge className="h-6 w-6 text-primary animate-pulse-soft" />
          </div>
        )}

        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-md hover:bg-sidebar-accent z-50"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-3 w-3 text-sidebar-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          
          const LinkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-sidebar-accent text-primary shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_2px_rgba(124,58,237,0.5)]" />
              )}
              
              <item.icon 
                className={cn(
                  "h-5 w-5 transition-colors shrink-0", 
                  isActive ? "text-primary filter drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]" : "group-hover:text-primary"
                )} 
              />
              
              {!isCollapsed && (
                <span className="truncate font-heading">{item.label}</span>
              )}
            </Link>
          );

          return isCollapsed ? (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                {LinkContent}
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-sidebar-accent text-foreground border-sidebar-border font-heading">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={item.href}>{LinkContent}</div>
          );
        })}
      </div>

      {/* "Daily Progress" Mini-Bar (Gamification) */}
      {!isCollapsed && (
        <div className="px-4 py-4 mx-4 mb-2 bg-sidebar-accent/30 rounded-xl border border-sidebar-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-yellow-500/20">
                <Zap className="h-3 w-3 text-yellow-500" />
              </div>
              <span className="text-xs font-semibold text-foreground">Daily XP</span>
            </div>
            <span className="text-xs text-muted-foreground">850/1000</span>
          </div>
          <Progress value={85} className="h-1.5 bg-background/50" indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
        </div>
      )}

      {/* Footer / Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            isCollapsed ? "justify-center px-0" : "justify-start"
          )}
          onClick={() => logout()}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
          {!isCollapsed && "Log Out"}
        </Button>
      </div>
    </aside>
  );
}