/**
 * MainLayout Component
 *
 * A shared layout component used across all marketing/public pages.
 * Includes a responsive header with desktop and mobile navigation,
 * a main content area, and a site footer.
 */

'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Gauge, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/about", label: "About" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* --- Site Header --- */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo and Branding */}
          <Link href="/" className="flex items-center gap-2">
            <Gauge className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">
               <span className="text-primary">Forti</span>Twin
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
                <Link 
                    key={link.href} 
                    href={link.href} 
                    className={cn(
                        "transition-colors hover:text-primary",
                        pathname === link.href ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {link.label}
                </Link>
            ))}
          </nav>
          
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
            <ModeToggle />
          </div>
          
          {/* Mobile Navigation Trigger */}
           <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b pb-4">
                             <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                                <Gauge className="h-6 w-6 text-primary" />
                                <span className="font-bold text-lg"><span className="text-primary">Forti</span>Twin</span>
                            </Link>
                            <SheetClose asChild>
                                <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
                            </SheetClose>
                        </div>
                        <nav className="flex flex-col gap-4 py-6">
                             {navLinks.map((link) => (
                                <SheetClose asChild key={link.href}>
                                    <Link 
                                        href={link.href} 
                                        className={cn(
                                            "text-lg font-medium transition-colors hover:text-primary",
                                            pathname === link.href ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                </SheetClose>
                            ))}
                        </nav>
                        <div className="mt-auto border-t pt-6 space-y-4">
                             <SheetClose asChild>
                                <Button variant="ghost" className="w-full justify-start text-lg" asChild>
                                    <Link href="/login">Login</Link>
                                </Button>
                            </SheetClose>
                             <SheetClose asChild>
                                <Button className="w-full text-lg" asChild>
                                    <Link href="/signup">Get Started</Link>
                                </Button>
                            </SheetClose>
                            <div className="pt-4">
                                <ModeToggle />
                            </div>
                        </div>
                    </div>
                </SheetContent>
             </Sheet>
           </div>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1">
        {children}
      </main>

      {/* --- Site Footer --- */}
      <footer className="py-8 border-t bg-muted/50">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <Gauge className="h-5 w-5 text-primary" />
             <span className="font-semibold">
               <span className="text-primary">Forti</span>Twin
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
             © {new Date().getFullYear()} FortiTwin Inc. All rights reserved.
          </div>

           <nav className="flex gap-4">
               <Link href="#" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link>
               <Link href="#" className="text-sm hover:text-primary transition-colors">Terms of Service</Link>
           </nav>
        </div>
      </footer>
    </div>
  );
}