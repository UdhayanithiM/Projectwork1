import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base Layout
          "flex h-11 w-full rounded-lg border px-4 py-2 text-sm transition-all duration-200",
          
          // Typography
          "font-body text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground",
          
          // THE DEEP VOID STYLE:
          // 1. Background: Translucent black/white (Glass)
          "bg-white/5 backdrop-blur-sm",
          
          // 2. Borders: Subtle, barely there until focused
          "border-white/10 hover:border-white/20",
          
          // 3. Focus State: The "Neon Ring"
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
          
          // Disabled State
          "disabled:cursor-not-allowed disabled:opacity-50",
          
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }