import { Host, ContextMenu, Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { ReactNode } from 'react';

export type CaptureListContextMenuProps = {
  onCopy: () => void;
  onArchive: () => void;
  children: ReactNode;
};

export function CaptureListContextMenu({
  onCopy,
  onArchive,
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
            label="Archive"
            systemImage="archivebox"
            onPress={onArchive}
          />
        </ContextMenu.Items>
      </ContextMenu>
    </Host>
  );
}
