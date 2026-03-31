import {
  Theme,
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { ReactNode, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useCSSVariable } from 'uniwind';

export type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const colorScheme = useColorScheme();
  const cssVars = useCSSVariable([
    '--color-primary',
    '--color-primary-foreground',
    '--color-background',
    '--color-card',
    '--color-border',
    '--color-destructive',
  ]);
  const theme = useMemo(() => {
    const [primary, primaryForeground, background, card, border, destructive] =
      cssVars;
    if (
      primary === undefined ||
      primaryForeground === undefined ||
      background === undefined ||
      card === undefined ||
      border === undefined ||
      destructive === undefined
    ) {
      throw new Error('CSS variables are not defined');
    }
    const colors: Theme['colors'] = {
      primary: primary.toString(),
      background: background.toString(),
      card: card.toString(),
      text: primaryForeground.toString(),
      border: border.toString(),
      notification: destructive.toString(),
    };
    return colorScheme === 'dark'
      ? { ...DarkTheme, colors }
      : { ...DefaultTheme, colors };
  }, [colorScheme, cssVars]);
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}
