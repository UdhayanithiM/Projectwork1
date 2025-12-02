// apps/web/lib/tokens.ts

export const tokens = {
  colors: {
    // Deep Void Theme (Dark Mode Default)
    dark: {
      background: "240 10% 3.9%",    // #0a0a0b
      foreground: "0 0% 98%",        // #fafafa
      
      card: "240 10% 3.9%",
      cardForeground: "0 0% 98%",
      
      popover: "240 10% 3.9%",
      popoverForeground: "0 0% 98%",
      
      primary: "263.4 70% 50.4%",    // #7c3aed (Electric Violet)
      primaryForeground: "210 40% 98%",
      
      secondary: "240 3.7% 15.9%",
      secondaryForeground: "0 0% 98%",
      
      muted: "240 3.7% 15.9%",
      mutedForeground: "240 5% 64.9%",
      
      accent: "240 3.7% 15.9%",
      accentForeground: "0 0% 98%",
      
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 0% 98%",
      
      border: "240 3.7% 15.9%",
      input: "240 3.7% 15.9%",
      ring: "263.4 70% 50.4%",       // Matching primary for focus rings
    },
    // Fallback/Light theme (Clean Slate)
    light: {
      background: "0 0% 100%",
      foreground: "240 10% 3.9%",
      card: "0 0% 100%",
      cardForeground: "240 10% 3.9%",
      popover: "0 0% 100%",
      popoverForeground: "240 10% 3.9%",
      primary: "240 5.9% 10%",
      primaryForeground: "0 0% 98%",
      secondary: "240 4.8% 95.9%",
      secondaryForeground: "240 5.9% 10%",
      muted: "240 4.8% 95.9%",
      mutedForeground: "240 3.8% 46.1%",
      accent: "240 4.8% 95.9%",
      accentForeground: "240 5.9% 10%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 0% 98%",
      border: "240 5.9% 90%",
      input: "240 5.9% 90%",
      ring: "240 10% 3.9%",
    }
  },
  radius: {
    DEFAULT: "0.75rem",
    sm: "calc(0.75rem - 4px)",
    md: "calc(0.75rem - 2px)",
    lg: "0.75rem",
  },
  animation: {
    float: "float 6s ease-in-out infinite",
    pulseSoft: "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  }
} as const;



