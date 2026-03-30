import React, { forwardRef, useMemo } from 'react';
import type { View, ViewProps } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Reanimated, { clamp, useAnimatedStyle } from 'react-native-reanimated';

type KeyboardStickyViewProps = {
  /**
   * Specify additional offset to the view for given keyboard state.
   */
  offset?: {
    /**
     * Adds additional `translateY` when keyboard is close. By default `0`.
     */
    closed?: number;
    /**
     * Adds additional `translateY` when keyboard is open. By default `0`.
     */
    opened?: number;
  };
} & ViewProps;

/**
 * XXX: Copied from react-native-keyboard-controller
 * Can be replaced once this fix is released: https://github.com/kirillzyusko/react-native-keyboard-controller/pull/397
 */
export const KeyboardStickyView = forwardRef<
  View,
  React.PropsWithChildren<KeyboardStickyViewProps>
>(
  (
    { children, offset: { closed = 0, opened = 0 } = {}, style, ...props },
    ref,
  ) => {
    const { height } = useReanimatedKeyboardAnimation();

    const stickyViewStyle = useAnimatedStyle(() => {
      const offset = clamp(height.value, closed, opened + height.value);

      return {
        transform: [{ translateY: offset }],
      };
    }, [closed, opened]);

    const styles = useMemo(
      () => [style, stickyViewStyle],
      [style, stickyViewStyle],
    );

    return (
      <Reanimated.View ref={ref} style={styles} {...props}>
        {children}
      </Reanimated.View>
    );
  },
);
