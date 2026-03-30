import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { GlassView } from 'expo-glass-effect';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const StyledGlassView = withUniwind(GlassView);
export const StyledSegmentedControl = withUniwind(SegmentedControl);
export const StyledSafeAreaView = withUniwind(SafeAreaView);
export const StyledKeyboardStickyView = withUniwind(KeyboardStickyView);
