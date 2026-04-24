import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  spacing: number;
  radius: 'sm' | 'md' | 'lg' | 'xl';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  shadow: 'sm' | 'md' | 'lg' | 'xl';
}

interface ThemeProviderProps {
  children: ReactNode;
}

const defaultTheme: Theme = {
  primaryColor: '#FF6B6B',
  secondaryColor: '#4ECDC4',
  accentColor: '#45B7D1',
  spacing: 4,
  radius: 'md',
  fontSize: 'md',
  shadow: 'md'
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme] = useState<Theme>(defaultTheme);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};