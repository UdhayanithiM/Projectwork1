import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------------------------------
 * CARD VARIANTS
 * -----------------------------------------------------------------------------------------------*/
const cardVariants = cva(
  "rounded-xl border transition-all duration-300",
  {
    variants: {
      variant: {
        // Standard Dark Card (Flat)
        default: 
          "bg-card text-card-foreground border-border shadow-sm",
        
        // ✨ THE PREMIUM LOOK: Translucent Glass
        glass: 
          "bg-white/5 backdrop-blur-md border-white/10 text-card-foreground shadow-xl",
        
        // ✨ FOR CLICKABLE TILES: Lifts and glows on hover
        interactive: 
          "bg-card/50 backdrop-blur-sm border-white/10 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-glow-soft cursor-pointer",
        
        // ✨ FOR HERO SECTIONS: Subtle neon pulse
        neon: 
          "bg-primary/5 border-primary/20 shadow-glow-soft hover:shadow-glow-primary hover:border-primary/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/* -------------------------------------------------------------------------------------------------
 * COMPONENT
 * -----------------------------------------------------------------------------------------------*/
interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    // Updated to use our new 'font-heading' class
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight font-heading text-white", 
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-body", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }