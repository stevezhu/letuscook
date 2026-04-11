import { Button } from '@workspace/rn-reusables/components/button';
import { Icon } from '@workspace/rn-reusables/components/icon';
import { cn } from '@workspace/rn-reusables/lib/utils';
import { GlassViewProps } from 'expo-glass-effect';
import { Provider, useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ArrowUp, Loader2 } from 'lucide-react-native';
import { createContext, ReactNode, use, useRef } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

import { SpinningView } from '#components/spinning.js';
import { StyledGlassView, StyledSegmentedControl } from '#components/styled.js';

import type { CaptureType } from '../guest-capture-types.js';
import {
  EMPTY_SEGMENTS,
  flattenSegments,
  reconcileSegments,
} from '../lib/segments.ts';
import {
  captureSegmentsAtom,
  captureTypeAtom,
  trimmedCaptureFlatTextAtom,
} from './capture-composer-atoms.ts';

export {
  captureSegmentsAtom,
  captureTypeAtom,
  captureFlatTextAtom,
} from './capture-composer-atoms.ts';

const CaptureComposerContext = createContext<{ isPending: boolean }>({
  isPending: false,
});

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
  const [segments, setSegments] = useAtom(captureSegmentsAtom);
  // Track the previous flat length so we can classify change events as paste
  // (multi-char net insert) vs. typing (single-char insert). Only paste is
  // allowed to create pills — typing a URL character-by-character stays plain.
  const prevFlatLenRef = useRef(flattenSegments(segments).length);

  const handleChangeText = (next: string) => {
    const delta = next.length - prevFlatLenRef.current;
    const isPasteLikely = delta > 1;
    const nextSegments = reconcileSegments(segments, next, { isPasteLikely });
    setSegments(nextSegments);
    prevFlatLenRef.current = flattenSegments(nextSegments).length;
  };

  return (
    <TextInput
      multiline
      // XXX: max height was manually obtained from `onContentSizeChange` event
      // `event.nativeEvent.contentSize.height`
      className={cn('text-base max-h-[221px]', className)}
      placeholder="What's on your mind?"
      onChangeText={handleChangeText}
      {...props}
    >
      {segments.map((seg, i) => {
        const key = `${seg.type}:${i}:${seg.value}`;
        return seg.type === 'pill' ? (
          <Text key={key} className="rounded bg-primary/10 px-1 text-primary">
            {'\u{1F517} '}
            {seg.value}
          </Text>
        ) : (
          <Text key={key}>{seg.value}</Text>
        );
      })}
    </TextInput>
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
  const setSegments = useSetAtom(captureSegmentsAtom);
  const trimmedText = useAtomValue(trimmedCaptureFlatTextAtom);
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
          setSegments(EMPTY_SEGMENTS);
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
