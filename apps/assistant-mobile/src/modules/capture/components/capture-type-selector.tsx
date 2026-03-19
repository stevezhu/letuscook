import { Text } from '@workspace/rn-reusables/components/text';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@workspace/rn-reusables/components/toggle-group';

import type { CaptureType } from '../guest-capture-types.ts';

const CAPTURE_TYPES: { value: CaptureType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'link', label: 'Link' },
  { value: 'task', label: 'Task' },
];

// 👀 Needs Verification
export function CaptureTypeSelector({
  value,
  onChange,
}: {
  value: CaptureType;
  onChange: (type: CaptureType) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => {
        if (val) onChange(val as CaptureType);
      }}
      variant="outline"
      className="self-start"
    >
      {CAPTURE_TYPES.map((item, index) => (
        <ToggleGroupItem
          key={item.value}
          value={item.value}
          isFirst={index === 0}
          isLast={index === CAPTURE_TYPES.length - 1}
          size="sm"
        >
          <Text>{item.label}</Text>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
