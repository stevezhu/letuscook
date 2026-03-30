import React, { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
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
export function withSpin<T extends object>(Component: React.ComponentType<T>) {
  const AnimatedComponent = Animated.createAnimatedComponent(
    Component as React.ComponentType<any>,
  );

  return function SpinningComponent(
    props: T & { className?: string } & ViewProps,
  ) {
    const { className, ...rest } = props;
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
        {...(rest as any)}
        className={className}
        style={[props.style, animatedStyle]}
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
