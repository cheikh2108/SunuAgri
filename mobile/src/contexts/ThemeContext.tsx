import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const lightColors = {
  primary: "#2D6A35",
  primaryLight: "#4A9955",
  secondary: "#C98A1A",
  secondaryLight: "#E8B84B",
  background: "#F5F7F3",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2EB",
  border: "#D8E3D4",
  text: "#1A2E1D",
  textSecondary: "#5A7060",
  textMuted: "#8FA893",
  destructive: "#C0392B",
  destructiveLight: "#FDECEA",
  success: "#2D6A35",
  successLight: "#E8F5E9",
  warning: "#C98A1A",
  warningLight: "#FFF8E1",
  overlay: "rgba(0,0,0,0.5)",
  white: "#FFFFFF",
} as const;

export const darkColors = {
  primary: "#4A9955",
  primaryLight: "#5CB86A",
  secondary: "#E8B84B",
  secondaryLight: "#F4CF7C",
  background: "#0F1410",
  surface: "#1A2E1D",
  surfaceAlt: "#243428",
  border: "#2D4231",
  text: "#E8F5E9",
  textSecondary: "#B8C9BC",
  textMuted: "#8FA893",
  destructive: "#E74C3C",
  destructiveLight: "#3D1F1C",
  success: "#4A9955",
  successLight: "#1F3B23",
  warning: "#E8B84B",
  warningLight: "#3D3520",
  overlay: "rgba(0,0,0,0.7)",
  white: "#FFFFFF",
} as const;

export type Colors = typeof lightColors;

interface ThemeContextValue {
  mode: ThemeMode;
  colors: Colors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = '@sunuagri_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [isReady, setIsReady] = useState(false);

  // Déterminer le thème effectif
  const effectiveTheme = mode === 'auto' ? (systemColorScheme ?? 'light') : mode;
  const isDark = effectiveTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (saved && ['light', 'dark', 'auto'].includes(saved)) {
          setModeState(saved as ThemeMode);
        }
        setIsReady(true);
      })
      .catch(() => setIsReady(true));
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Ne pas rendre les enfants avant d'avoir chargé le thème
  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
