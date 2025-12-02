"use client"; // This component needs to be a client component to use hooks

import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook to get the current URL
import { Home, Users, HelpCircle, FileText } from "lucide-react"; // Updated icons
import { cn } from "@/lib/utils"; // A utility for combining class names

export function AdminNav() {
  const pathname = usePathname(); // Get the current path, e.g., "/admin/users"

  // We add the "Assessments" link to this array
  const links = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/questions", label: "Question Bank", icon: HelpCircle },
    { href: "/admin/assessments", label: "Assessments", icon: FileText }, // <-- ADDED THIS LINE
  ];

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              isActive
                ? "bg-muted text-primary" // Active styles
                : "text-muted-foreground" // Inactive styles
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}