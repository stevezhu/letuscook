import type { User as AuthKitUser } from '@workos-inc/node';
import { pick } from 'es-toolkit/object';

/**
 * Custom user type for the application
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export type User = Pick<
  AuthKitUser,
  'id' | 'email' | 'firstName' | 'lastName' | 'profilePictureUrl'
>;

/**
 * Map AuthKit user response to our User type
 *
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 *
 * @param authKitUser
 * @returns
 */
export function toUser(authKitUser: AuthKitUser): User {
  return pick(authKitUser, [
    'id',
    'email',
    'firstName',
    'lastName',
    'profilePictureUrl',
  ]);
}
