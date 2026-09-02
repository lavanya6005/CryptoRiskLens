import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Read saved preference, fallback to 'light'
  const [theme, setTheme] = useState(
    () => localStorage.getItem('cr-theme') || 'light'
  );

  // Apply data-theme attribute to <html> whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cr-theme', theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Convenience hook
export function useTheme() {
  return useContext(ThemeContext);
}
