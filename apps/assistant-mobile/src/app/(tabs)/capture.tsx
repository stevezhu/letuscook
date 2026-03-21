import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';

import { DefaultSuspense } from '#components/default-suspense.tsx';
import { CaptureInput } from '#modules/capture/components/capture-input.tsx';
import { RecentCapturesList } from '#modules/capture/components/recent-captures-list.tsx';

export default function CaptureTab() {
  return (
    <DefaultSuspense>
      <CaptureScreen />
    </DefaultSuspense>
  );
}

// 👀 Needs Verification
function CaptureScreen() {
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
