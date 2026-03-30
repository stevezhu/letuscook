import { Button } from '@workspace/rn-reusables/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/rn-reusables/components/card';
import { Text } from '@workspace/rn-reusables/components/text';
import { ScrollView, View } from 'react-native';

import { DefaultActivityView } from '#components/default-activity-view.tsx';
import { DefaultSuspense } from '#components/default-suspense.tsx';
import { useAuth } from '#modules/auth/react/auth-provider.tsx';

export default function HomeTab() {
  return (
    <DefaultSuspense>
      <HomeScreen />
    </DefaultSuspense>
  );
}

function HomeScreen() {
  const { isLoading, user, signIn } = useAuth();

  if (isLoading) {
    return <DefaultActivityView />;
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustsScrollIndicatorInsets={true}
      className="flex-1 bg-background"
      contentContainerClassName="p-6"
    >
      <View className="flex-col gap-8">
        <View className="flex-col gap-2">
          <Text className="text-lg font-medium text-muted-foreground">
            Welcome back,
          </Text>
          <Text className="text-4xl font-bold tracking-tight text-foreground">
            {user?.firstName ?? 'Guest'}
          </Text>
        </View>

        {!user && (
          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Sign in to your account to get started with Assistant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onPress={signIn}>
                <Text>Sign In</Text>
              </Button>
            </CardContent>
          </Card>
        )}

        <View className="flex-col gap-4">
          <Text className="text-xl font-semibold text-foreground">
            Recent Activity
          </Text>
          <Card>
            <CardContent className="flex-col items-center justify-center gap-2 py-10">
              <Text className="text-center text-muted-foreground">
                No recent activity to show.
              </Text>
            </CardContent>
          </Card>
        </View>

        <View className="flex-col gap-4">
          <Text className="text-xl font-semibold text-foreground">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <Card className="min-w-[140px] flex-1">
              <CardHeader className="gap-2">
                <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                  <Text className="font-bold text-primary">+</Text>
                </View>
                <CardTitle className="text-base">New Task</CardTitle>
              </CardHeader>
            </Card>
            <Card className="min-w-[140px] flex-1">
              <CardHeader className="gap-2">
                <View className="size-10 items-center justify-center rounded-full bg-primary/10">
                  <Text className="font-bold text-primary">📄</Text>
                </View>
                <CardTitle className="text-base">Draft Doc</CardTitle>
              </CardHeader>
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
