import { createContext, useContext, useState, useEffect } from 'react'

// 1. Create the context
const ThemeContext = createContext()

// 2. Create the provider
export const ThemeProvider = ({ children }) => {

  // 3. Load saved theme from localStorage
  // If no saved theme, default to 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  // 4. When theme changes, save to localStorage
  // and update the HTML body class
  useEffect(() => {
    localStorage.setItem('theme', theme)

    // Add class to body so CSS knows which theme is active
    document.body.className = theme
    // body will have class 'light' or 'dark'
  }, [theme])

  // 5. Toggle between light and dark
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 6. Custom hook for easy access
export const useTheme = () => useContext(ThemeContext)