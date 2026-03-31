import { Button } from '@workspace/rn-reusables/components/button';
import { Icon } from '@workspace/rn-reusables/components/icon';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { GlassViewProps } from 'expo-glass-effect';
import { atom, Provider, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, Check, Loader2 } from 'lucide-react-native';
import { createContext, ReactNode, use } from 'react';
import { Alert, TextInput, TextInputProps, View } from 'react-native';

import { SpinningView } from '#components/spinning.js';
import { StyledGlassView, StyledSegmentedControl } from '#components/styled.js';

import type { CaptureType } from '../guest-capture-types.js';

const CaptureComposerContext = createContext<{
  isPending: boolean;
  isSuccess: boolean;
}>({
  isPending: false,
  isSuccess: false,
});

const textAtom = atom('');
const trimmedTextAtom = atom((get) => get(textAtom).trim());
const captureTypeAtom = atom<CaptureType>('text');

export type CaptureComposerProps = GlassViewProps & {
  isPending: boolean;
  isSuccess?: boolean;
  children: ReactNode;
};

export function CaptureComposer({
  isPending,
  isSuccess = false,
  className,
  children,
  ...props
}: CaptureComposerProps) {
  return (
    <Provider>
      <CaptureComposerContext.Provider value={{ isPending, isSuccess }}>
        <StyledGlassView
          isInteractive
          className={cn('rounded-3xl p-2 flex gap-4', className)}
          {...props}
        >
          {children}
        </StyledGlassView>
      </CaptureComposerContext.Provider>
    </Provider>
  );
}

export type CaptureComposerTextInputProps = TextInputProps;

export function CaptureComposerTextInput({
  className,
  ...props
}: CaptureComposerTextInputProps) {
  const [text, setText] = useAtom(textAtom);
  return (
    <TextInput
      multiline
      // XXX: max height was manually obtained from `onContentSizeChange` event
      // `event.nativeEvent.contentSize.height`
      className={cn('text-base max-h-[221px]', className)}
      placeholder="What's on your mind?"
      value={text}
      onChangeText={setText}
      onContentSizeChange={
        __DEV__
          ? (event) => {
              console.debug(event.nativeEvent.contentSize.height);
            }
          : undefined
      }
      {...props}
    />
  );
}

export type CaptureComposerControlsProps = {
  onSubmit: (data: {
    value: string;
    captureType: CaptureType;
  }) => Promise<void>;
};

export function CaptureComposerControls({
  onSubmit,
}: CaptureComposerControlsProps) {
  const { isPending, isSuccess } = use(CaptureComposerContext);
  const setText = useSetAtom(textAtom);
  const trimmedText = useAtomValue(trimmedTextAtom);
  const [captureType, setCaptureType] = useAtom(captureTypeAtom);

  const canSend = !isPending && trimmedText.length > 0;
  return (
    <View className="align-end flex-row justify-between gap-2">
      <CaptureTypeSegmentedControl
        value={captureType}
        onChange={setCaptureType}
      />
      <Button
        size="icon"
        className="rounded-full disabled:bg-muted"
        disabled={!canSend}
        accessibilityLabel="Send capture"
        onPress={async () => {
          if (!canSend) return;
          if (!trimmedText) return;

          try {
            await onSubmit({ value: trimmedText, captureType });
            setText('');
          } catch {
            Alert.alert(
              'Failed to save',
              'Your capture could not be saved. Please try again.',
            );
          }
        }}
      >
        {isPending ? (
          <SpinningView className="pointer-events-none animate-spin">
            <Icon as={Loader2} className="text-muted-foreground" />
          </SpinningView>
        ) : isSuccess ? (
          <Icon as={Check} className="text-green-600" />
        ) : (
          <Icon
            as={ArrowUp}
            className={cn(
              canSend ? 'text-primary-foreground' : 'text-muted-foreground',
            )}
          />
        )}
      </Button>
    </View>
  );
}

const CAPTURE_TYPES: { value: CaptureType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'task', label: 'Task' },
];
const CAPTURE_TYPES_ORDER = Object.fromEntries(
  CAPTURE_TYPES.map((item, index) => [item.value, index]),
);

function CaptureTypeSegmentedControl({
  value,
  onChange,
}: {
  value: CaptureType;
  onChange: (type: CaptureType) => void;
}) {
  return (
    <StyledSegmentedControl
      className="h-full flex-1"
      values={CAPTURE_TYPES.map((item) => item.label)}
      selectedIndex={CAPTURE_TYPES_ORDER[value]}
      onChange={(event) => {
        const index = event.nativeEvent.selectedSegmentIndex;
        const captureType = CAPTURE_TYPES[index];
        if (!captureType) {
          throw new Error(`Invalid index: ${index}`);
        }
        onChange(captureType.value as CaptureType);
      }}
    />
  );
}
