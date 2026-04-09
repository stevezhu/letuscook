import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * Reference:
 * https://docs.expo.dev/router/advanced/native-tabs/#load-once-on-first-focus
 *
 * Activated means the screen has been focused at least once.
 *
 * @returns True if the screen has been activated, false otherwise
 */
export function useHasActivated() {
  const [hasActivated, setHasActivated] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setHasActivated(true);
    }, []),
  );

  return hasActivated;
}
