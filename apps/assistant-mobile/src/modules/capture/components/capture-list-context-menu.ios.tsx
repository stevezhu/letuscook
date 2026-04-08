import { Host, ContextMenu, Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { ReactNode } from 'react';

export type CaptureListContextMenuProps = {
  onCopy: () => void;
  onDelete: () => void;
  children: ReactNode;
};

export function CaptureListContextMenu({
  onCopy,
  onDelete,
  children,
}: CaptureListContextMenuProps) {
  return (
    <Host matchContents>
      <ContextMenu>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
        <ContextMenu.Items>
          <SwiftUIButton
            label="Copy"
            systemImage="doc.on.doc"
            onPress={onCopy}
          />
          <SwiftUIButton
            label="Delete"
            systemImage="trash"
            role="destructive"
            onPress={onDelete}
          />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
