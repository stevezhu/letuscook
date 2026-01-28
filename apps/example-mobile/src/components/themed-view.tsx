import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '#constants/theme.js';
import { useTheme } from '#hooks/use-theme.js';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[{ backgroundColor: theme[type ?? 'background'] }, style]}
      {...otherProps}
    />
  );
}
