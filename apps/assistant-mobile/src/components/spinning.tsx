import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * An Animated.View that spins infinitely when 'animate-spin' is in className.
 *
 * @example
 * <SpinningView className="animate-spin">...</SpinningView>
 */
// 👀 Needs Verification
export function SpinningView(
  props: React.ComponentProps<typeof Animated.View>,
) {
  const { className } = props;
  const rotation = useSharedValue(0);
  const isSpinning =
    typeof className === 'string'
      ? className.includes('animate-spin')
      : className?.get()?.includes('animate-spin');

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return <Animated.View {...props} style={[props.style, animatedStyle]} />;
}

export { SpinningView as Spinning };
