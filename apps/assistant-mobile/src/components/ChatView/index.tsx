import { cn } from '@workspace/rn-reusables/lib/utils';
import { ReactNode } from 'react';
import {
  KeyboardGestureArea,
  KeyboardGestureAreaProps,
} from 'react-native-keyboard-controller';

const showBgColors = true;

export type ChatViewProps = KeyboardGestureAreaProps;

export function ChatView({ children, ...props }: ChatViewProps) {
  return (
    <KeyboardGestureArea
      interpolator="ios"
      // offset={inputHeight}
      // style={styles.container}
      // style={{ marginBottom: MARGIN }} // XXX: this is what causes a white space at the bottom
      style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: showBgColors ? 'green' : undefined,
      }}
      {...props}
    >
      {children}
    </KeyboardGestureArea>
  );
}
