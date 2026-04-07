import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';
import { Component, type ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode;
  onGoBack?: () => void;
};

type State = {
  error: Error | null;
};

export class QueryErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center gap-4 p-8">
        <Text className="text-center text-base text-muted-foreground">
          Something went wrong
        </Text>
        <Text
          className="text-center text-sm text-muted-foreground"
          numberOfLines={3}
        >
          {this.state.error.message}
        </Text>
        <View className="flex-row gap-3">
          {this.props.onGoBack && (
            <Button variant="outline" onPress={this.props.onGoBack}>
              <Text>Go back</Text>
            </Button>
          )}
          <Button onPress={this.reset}>
            <Text>Try again</Text>
          </Button>
        </View>
      </View>
    );
  }
}
