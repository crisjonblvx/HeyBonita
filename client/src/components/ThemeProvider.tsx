import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
type ColorScheme = 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'black';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('red');

  useEffect(() => {
    const savedTheme = localStorage.getItem('bonita-theme') as Theme;
    const savedColorScheme = localStorage.getItem('bonita-color-scheme') as ColorScheme;
    
    if (savedTheme) {
      setTheme(savedTheme);
    }
    if (savedColorScheme) {
      setColorScheme(savedColorScheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Remove all color scheme classes
    root.classList.remove('color-red', 'color-blue', 'color-green', 'color-purple', 'color-orange', 'color-pink', 'color-black');
    root.classList.add(`color-${colorScheme}`);
    
    localStorage.setItem('bonita-theme', theme);
    localStorage.setItem('bonita-color-scheme', colorScheme);
  }, [theme, colorScheme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const updateColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme, 
      setTheme, 
      setColorScheme: updateColorScheme, 
      toggleTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
