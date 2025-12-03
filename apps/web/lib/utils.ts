import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes with clsx logic.
 * Essential for the atomic design system (Buttons, Cards) to allow overrides.
 * * @example
 * cn("bg-red-500", isPrimary && "bg-blue-500") 
 * // Output: "bg-blue-500" (correctly overrides red)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}