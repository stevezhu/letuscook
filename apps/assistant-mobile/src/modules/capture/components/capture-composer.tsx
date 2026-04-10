import { Button } from '@workspace/rn-reusables/components/button';
import { Icon } from '@workspace/rn-reusables/components/icon';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { GlassViewProps } from 'expo-glass-effect';
import { atom, Provider, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, Loader2 } from 'lucide-react-native';
import { createContext, ReactNode, use } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';

import { SpinningView } from '#components/spinning.js';
import { StyledGlassView, StyledSegmentedControl } from '#components/styled.js';

import type { CaptureType } from '../guest-capture-types.js';

const CaptureComposerContext = createContext<{ isPending: boolean }>({
  isPending: false,
});

export const captureTextAtom = atom('');
const trimmedCaptureTextAtom = atom((get) => get(captureTextAtom).trim());
export const captureTypeAtom = atom<CaptureType>('text');

export type CaptureComposerProps = GlassViewProps & {
  isPending: boolean;
  children: ReactNode;
};

export function CaptureComposer({
  isPending,
  className,
  children,
  ...props
}: CaptureComposerProps) {
  return (
    <Provider>
      <CaptureComposerContext.Provider value={{ isPending }}>
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
  const [text, setText] = useAtom(captureTextAtom);
  return (
    <TextInput
      multiline
      // XXX: max height was manually obtained from `onContentSizeChange` event
      // `event.nativeEvent.contentSize.height`
      className={cn('text-base max-h-[221px]', className)}
      placeholder="What's on your mind?"
      value={text}
      onChangeText={setText}
      onContentSizeChange={(event) => {
        console.debug(event.nativeEvent.contentSize.height);
      }}
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
  const { isPending } = use(CaptureComposerContext);
  const setText = useSetAtom(captureTextAtom);
  const trimmedText = useAtomValue(trimmedCaptureTextAtom);
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

          // TODO: add error handling
          await onSubmit({ value: trimmedText, captureType });
          setText('');
        }}
      >
        {/* TODO: show success/stop icon */}
        {isPending ? (
          <SpinningView className="pointer-events-none animate-spin">
            <Icon as={Loader2} className="text-muted-foreground" />
          </SpinningView>
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
