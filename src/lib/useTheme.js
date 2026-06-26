import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'exora-theme'

/**
 * Reads/writes theme preference to localStorage.
 * Falls back to 'light' if nothing stored or localStorage unavailable
 * (e.g. private browsing edge cases, SSR).
 */
function getStoredTheme() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : 'dark'
  } catch {
    return 'light'
  }
}

function setStoredTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage unavailable — theme just won't persist this session
  }
}

/**
 * useTheme — no auth required, works for anonymous/public pages.
 * Usage:
 *   const { theme, toggleTheme } = useTheme()
 *   <div data-theme={theme}>...</div>
 */
export function useTheme() {
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    setStoredTheme(theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return { theme, toggleTheme, setTheme }
}
