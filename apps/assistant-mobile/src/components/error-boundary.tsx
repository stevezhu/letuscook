import { Button } from '@workspace/rn-reusables/components/button';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text className="text-lg font-semibold text-foreground">
            Something went wrong
          </Text>
          <Text className="text-center text-muted-foreground">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <Button
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text className="text-primary-foreground">Try Again</Text>
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
