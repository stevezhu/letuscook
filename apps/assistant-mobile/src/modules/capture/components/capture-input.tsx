import { Button } from '@workspace/rn-reusables/components/button';
import { Icon } from '@workspace/rn-reusables/components/icon';
import { Text } from '@workspace/rn-reusables/components/text';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { ArrowUp, Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.tsx';

import type { CaptureType } from '../guest-capture-types.ts';
import { useCaptureSubmit } from '../use-capture-submit.ts';
import { CaptureTypeSelector } from './capture-type-selector.tsx';

// 👀 Needs Verification
export function CaptureInput() {
  const [text, setText] = useState('');
  const [captureType, setCaptureType] = useState<CaptureType>('text');
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { submit, isPending, limitReached } = useCaptureSubmit();
  const { signIn } = useAuth();

  const canSend = text.trim().length > 0 && !isPending;

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 1500);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  if (limitReached) {
    return (
      <View className="border-border items-center gap-3 border-t px-4 py-4">
        <Text className="text-muted-foreground text-center text-sm">
          Sign in to continue capturing
        </Text>
        <Button onPress={signIn}>
          <Text>Sign In</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="border-border border-t px-4 pb-2 pt-3">
      <CaptureTypeSelector value={captureType} onChange={setCaptureType} />
      <View className="mt-2 flex-row items-end gap-2">
        <TextInput
          ref={inputRef}
          className="border-input bg-background text-foreground min-h-[40px] flex-1 rounded-2xl border px-4 py-2.5 text-base"
          placeholder="What's on your mind?"
          placeholderTextColor="#9ca3af"
          value={text}
          onChangeText={setText}
          multiline
          submitBehavior="submit"
          textAlignVertical="top"
        />
        <Button
          size="icon"
          className={cn(
            'bg-primary mb-0.5 h-9 w-9 rounded-full shadow-sm',
            canSend ? 'bg-primary' : 'bg-muted',
          )}
          disabled={!canSend}
          onPress={async () => {
            const trimmed = text.trim();
            if (!trimmed || isPending) return;

            try {
              await submit(trimmed, captureType);
              setText('');
              setShowSuccess(true);
            } catch {
              // limit reached is handled by limitReached state
            }
          }}
          accessibilityLabel="Send capture"
        >
          {showSuccess ? (
            <Icon as={Check} className="text-primary-foreground size-[18px]" />
          ) : (
            <Icon
              as={ArrowUp}
              className={cn(
                'size-[18px]',
                canSend ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
          )}
        </Button>
      </View>
    </View>
  );
}
