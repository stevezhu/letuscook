import React, { ComponentProps, ComponentType, useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type AnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A Higher-Order Component that adds an infinite spin animation to any component.
 * It triggers the animation when 'animate-spin' is present in the className.
 *
 * @example
 * const SpinningView = withSpin(View);
 * <SpinningView className="animate-spin">...</SpinningView>
 */
export function withSpin<T extends { className?: string }>(
  Component: ComponentType<T>,
) {
  const AnimatedComponent = Animated.createAnimatedComponent(Component);

  return function SpinningComponent(
    props: ComponentProps<typeof AnimatedComponent>,
  ) {
    const { className } = props;
    const rotation = useSharedValue(0);
    const isSpinning = className?.includes('animate-spin');

    useEffect(() => {
      if (isSpinning) {
        rotation.value = withRepeat(
          withTiming(360, {
            duration: 1000,
            easing: Easing.linear,
          }),
          -1,
        );
      } else {
        cancelAnimation(rotation);
        rotation.value = 0;
      }

      return () => cancelAnimation(rotation);
    }, [isSpinning, rotation]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ rotate: `${rotation.value}deg` }],
      };
    });

    return (
      <AnimatedComponent
        {...props}
        // style={[props.style, animatedStyle]}
      />
    );
  };
}

/**
 * A pre-wrapped Animated.View that supports 'animate-spin' in className.
 */
export const SpinningView = withSpin(Animated.View);

/**
 * Alias for SpinningView to maintain compatibility.
 */
export { SpinningView as Spinning };
