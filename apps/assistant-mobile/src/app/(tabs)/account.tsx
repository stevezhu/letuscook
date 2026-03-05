import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/rn-reusables/components/avatar';
import { Button } from '@workspace/rn-reusables/components/button';
import { Separator } from '@workspace/rn-reusables/components/separator';
import { Text } from '@workspace/rn-reusables/components/text';
import { View } from 'react-native';

import { useAuth } from '#modules/auth/auth-context.js';

export default function AccountIndex() {
  const { user, signOut } = useAuth();
  if (!user) {
    throw new Error('User not found');
  }

  return (
    <View className="p-safe">
      <Avatar alt={`${user.firstName} ${user.lastName}'s Avatar`}>
        <AvatarImage source={{ uri: user.profilePictureUrl ?? undefined }} />
        <AvatarFallback>
          <Text>
            {[user.firstName?.[0], user.lastName?.[0]]
              .filter(Boolean)
              .join('')
              .toUpperCase() || user.email[0].toUpperCase()}
          </Text>
        </AvatarFallback>
      </Avatar>
      <Text className="text-2xl font-bold">
        {user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email}
      </Text>

      <Separator />

      <View>
        <Text className="text-sm">Email</Text>
        <Text className="text-sm">{user.email}</Text>
      </View>

      <View>
        <Text className="text-sm">User ID</Text>
        <Text className="text-sm">{user.id}</Text>
      </View>

      {user.firstName && (
        <View>
          <Text className="text-sm">First Name</Text>
          <Text className="text-sm">{user.firstName}</Text>
        </View>
      )}

      {user.lastName && (
        <View>
          <Text className="text-sm">Last Name</Text>
          <Text className="text-sm">{user.lastName}</Text>
        </View>
      )}

      <View>
        <Button onPress={() => signOut()}>
          <Text>Sign Out</Text>
        </Button>
      </View>
    </View>
  );
}
