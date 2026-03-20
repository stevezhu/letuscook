import { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';

import { CaptureInput } from '#modules/capture/components/capture-input.tsx';
import { RecentCapturesList } from '#modules/capture/components/recent-captures-list.tsx';

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () =>
      setVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardWillHide', () =>
      setVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  return visible;
}

// 👀 Needs Verification
function CaptureScreenInner() {
  const keyboardVisible = useKeyboardVisible();

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View className="flex-1 pt-safe">
        <RecentCapturesList />
      </View>
      <View className={keyboardVisible ? undefined : 'pb-20'}>
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
