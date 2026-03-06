import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/rn-reusables/components/card';
import { Text } from '@workspace/rn-reusables/components/text';
import { ScrollView, View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.js';
import { SignInButton } from '#modules/auth/SignInButton.js';

export default function HomeScreen() {
  const { user } = useAuth();
  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-6">
      <View className="p-safe-t flex-col gap-8">
        <View className="flex-col gap-2">
          <Text className="text-muted-foreground text-lg font-medium">
            Welcome back,
          </Text>
          <Text className="text-foreground text-4xl font-bold tracking-tight">
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
              <SignInButton />
            </CardContent>
          </Card>
        )}

        <View className="flex-col gap-4">
          <Text className="text-foreground text-xl font-semibold">
            Recent Activity
          </Text>
          <Card>
            <CardContent className="py-10 flex-col items-center justify-center gap-2">
              <Text className="text-muted-foreground text-center">
                No recent activity to show.
              </Text>
            </CardContent>
          </Card>
        </View>

        <View className="flex-col gap-4">
          <Text className="text-foreground text-xl font-semibold">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <Card className="flex-1 min-w-[140px]">
              <CardHeader className="gap-2">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-primary font-bold">+</Text>
                </View>
                <CardTitle className="text-base">New Task</CardTitle>
              </CardHeader>
            </Card>
            <Card className="flex-1 min-w-[140px]">
              <CardHeader className="gap-2">
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-primary font-bold">📄</Text>
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
