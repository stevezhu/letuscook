import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

import type { CaptureState } from '../inbox-types.ts';

const stateConfig: Record<
  CaptureState,
  { label: string; bg: string; text: string }
> = {
  offline: { label: 'Offline', bg: 'bg-muted', text: 'text-muted-foreground' },
  processing: {
    label: 'Processing',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  ready: { label: 'Ready', bg: 'bg-green-100', text: 'text-green-700' },
  failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-700' },
  needs_manual: {
    label: 'Needs manual',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
  },
  processed: {
    label: 'Processed',
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
};

export function StatePill({ state }: { state: CaptureState }) {
  const config = stateConfig[state];
  return (
    <View className={`rounded-full px-2 py-0.5 ${config.bg}`}>
      <Text className={`text-xs font-medium ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
