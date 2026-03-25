import React, { ReactNode } from 'react';
import {
  SafeAreaListener,
  SafeAreaListenerProps,
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';

const safeAreaListenerOnChange: SafeAreaListenerProps['onChange'] = ({
  insets,
}) => {
  Uniwind.updateInsets(insets);
};

export type AppSafeAreaProviderProps = {
  children: ReactNode;
};

export function AppSafeAreaProvider({ children }: AppSafeAreaProviderProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaListener onChange={safeAreaListenerOnChange}>
        {children}
      </SafeAreaListener>
    </SafeAreaProvider>
  );
}
