import { Button } from '@workspace/rn-reusables/components/button';
import { Text } from '@workspace/rn-reusables/components/text';

import { useAuth } from '#modules/auth/auth-context.js';

export function SignInButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (user) {
    return (
      <Button onPress={signOut}>
        <Text>Sign Out</Text>
      </Button>
    );
  }

  return (
    <Button onPress={signIn}>
      <Text>Sign In</Text>
    </Button>
  );
}
