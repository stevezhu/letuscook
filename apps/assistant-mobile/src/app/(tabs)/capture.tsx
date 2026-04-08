import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from 'assistant-convex/convex/_generated/api';
import type { Id } from 'assistant-convex/convex/_generated/dataModel';
import { useCallback, useId, useMemo, useState } from 'react';
import { KeyboardGestureArea } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { DefaultSuspense } from '#components/boundaries/default-suspense.tsx';
import { StyledKeyboardStickyView } from '#components/styled.ts';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';
import {
  CaptureComposer,
  CaptureComposerControls,
  CaptureComposerTextInput,
} from '#modules/capture/components/capture-composer.tsx';
import {
  CaptureItemData,
  CaptureList,
} from '#modules/capture/components/capture-list.tsx';
import { useCaptureSubmit } from '#modules/capture/use-capture-submit.ts';
import { useGuestCaptureStore } from '#modules/capture/use-guest-capture-store.ts';

export default function CaptureTab() {
  return (
    <DefaultSuspense>
      <CaptureScreen />
    </DefaultSuspense>
  );
}

const TEXT_HEIGHT = 101;

// 👀 Needs Verification
function CaptureScreen() {
  const textInputNativeId = useId();
  const [inputHeight, setInputHeight] = useState(TEXT_HEIGHT);
  const { bottom } = useSafeAreaInsets();
  const spacing = useCSSVariable('--spacing') as number;
  const { submit, isPending } = useCaptureSubmit();
  const { user } = useAuth();
  const { data: serverCaptures } = useQuery(
    convexQuery(api.captures.getRecentCaptures, user ? { limit: 20 } : 'skip'),
  );
  const { captures: guestCaptures, removeGuestCapture } =
    useGuestCaptureStore();

  const { mutate: archiveCapture } = useMutation({
    mutationFn: useConvexMutation(api.captures.archiveCapture),
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (user) {
        archiveCapture({ captureId: id as Id<'captures'> });
      } else {
        removeGuestCapture.mutate(id);
      }
    },
    [user, archiveCapture, removeGuestCapture],
  );

  const items: CaptureItemData[] = useMemo(() => {
    if (user) {
      return (serverCaptures ?? []).map((c) => ({
        id: c._id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
    }
    return [...guestCaptures]
      .sort((a, b) => b.capturedAt - a.capturedAt)
      .map((c) => ({
        id: c.id,
        rawContent: c.rawContent,
        capturedAt: c.capturedAt,
        captureType: c.captureType,
      }));
  }, [user, serverCaptures, guestCaptures]);

  return (
    <KeyboardGestureArea
      interpolator="ios"
      offset={inputHeight}
      style={{ flex: 1, justifyContent: 'flex-end' }}
      textInputNativeID={textInputNativeId}
    >
      <CaptureList
        data={items}
        onDelete={handleDelete}
        estimatedItemSize={60}
        contentContainerStyle={{
          paddingBottom: TEXT_HEIGHT + spacing * 2,
        }}
      />
      <StyledKeyboardStickyView
        className="absolute w-full px-2"
        offset={{ opened: bottom }}
        style={{
          minHeight: TEXT_HEIGHT,
          marginBottom: bottom + spacing * 2,
        }}
      >
        <CaptureComposer
          isPending={isPending}
          onLayout={(e) => {
            setInputHeight(e.nativeEvent.layout.height);
          }}
        >
          <CaptureComposerTextInput />
          <CaptureComposerControls
            onSubmit={async ({ value, captureType }) => {
              await submit(value, captureType);
            }}
          />
        </CaptureComposer>
      </StyledKeyboardStickyView>
    </KeyboardGestureArea>
  );
}
