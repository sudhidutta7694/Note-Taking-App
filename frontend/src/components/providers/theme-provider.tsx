"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Try importing directly from next-themes first
type ThemeProviderProps = Parameters<typeof NextThemesProvider>[0]

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
