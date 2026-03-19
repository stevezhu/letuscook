import { Suspense } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';

import { CaptureInput } from '#modules/capture/components/capture-input.tsx';
import { RecentCapturesList } from '#modules/capture/components/recent-captures-list.tsx';

// 👀 Needs Verification
function CaptureScreenInner() {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Pressable className="flex-1 pt-safe" onPress={Keyboard.dismiss}>
        <RecentCapturesList />
      </Pressable>
      <View className="pb-20">
        <CaptureInput />
      </View>
    </KeyboardAvoidingView>
  );
}

export default function CaptureScreen() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      }
    >
      <CaptureScreenInner />
    </Suspense>
  );
}
