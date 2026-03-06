import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/rn-reusables/components/avatar';
import { Button } from '@workspace/rn-reusables/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/rn-reusables/components/card';
import { Separator } from '@workspace/rn-reusables/components/separator';
import { Text } from '@workspace/rn-reusables/components/text';
import { Redirect } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.js';

export default function AccountIndex() {
  const { user, signOut } = useAuth();
  if (!user) {
    return <Redirect href="/" />;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  const initials =
    [user.firstName?.[0], user.lastName?.[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() || user.email[0].toUpperCase();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-6"
    >
      <View className="flex-col gap-8">
        <View className="flex-col items-center justify-center gap-4">
          <Avatar
            alt={`${fullName}'s Avatar`}
            className="w-24 h-24 shadow-lg shadow-black/10"
          >
            <AvatarImage
              source={{ uri: user.profilePictureUrl ?? undefined }}
            />
            <AvatarFallback>
              <Text className="text-3xl font-bold">{initials}</Text>
            </AvatarFallback>
          </Avatar>
          <View className="items-center gap-1">
            <Text className="text-foreground text-3xl font-bold">
              {fullName}
            </Text>
            <Text className="text-muted-foreground text-lg">{user.email}</Text>
          </View>
        </View>

        <View className="flex-col gap-4">
          <Button
            variant="outline"
            className="border-destructive active:bg-destructive/10"
            onPress={() => signOut()}
          >
            <Text className="text-destructive font-semibold">Sign Out</Text>
          </Button>
          <Text className="text-muted-foreground text-xs text-center">
            Signed in as {user.email}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
