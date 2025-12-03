import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * FortiTwin 3.0 Button Component
 * Includes "Neon", "Glass", and "Micro-interaction" upgrades.
 */
const buttonVariants = cva(
  // Base styles: Flexbox centering, focus rings, disabled states, and the tactile "scale-95" press effect.
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background select-none active:scale-95 gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
        
        // ✨ NEW: High-visibility Neon variant for Primary CTAs
        neon: 
          "bg-primary text-primary-foreground border border-primary/50 shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:shadow-[0_0_30px_rgba(124,58,237,0.7)] hover:bg-primary/90 transition-all duration-300",
        
        // ✨ NEW: Glassmorphism variant for secondary actions on dark backgrounds
        glass:
          "bg-white/5 backdrop-blur-md border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 hover:text-white shadow-sm transition-all",

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        
        ghost: 
          "hover:bg-accent hover:text-accent-foreground",
        
        link: 
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        // ✨ NEW: Hero Section CTA size
        xl: "h-14 rounded-xl px-10 text-lg font-semibold", 
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }