import { Host, ContextMenu, Button as SwiftUIButton } from '@expo/ui/swift-ui';
import { ReactNode } from 'react';
import { withUniwind } from 'uniwind';

const StyledHost = withUniwind(Host);

export type CaptureListContextMenuProps = {
  className?: string;
  onCopy: () => void;
  onArchive: () => void;
  children: ReactNode;
};

export function CaptureListContextMenu({
  className,
  onCopy,
  onArchive,
  children,
}: CaptureListContextMenuProps) {
  return (
    <StyledHost matchContents ignoreSafeArea="all" className={className}>
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
    </StyledHost>
  );
}
