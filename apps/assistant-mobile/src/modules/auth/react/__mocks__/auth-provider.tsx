import { type useAuth as useAuthType } from '../auth-provider.tsx';

type UseAuthParams = Parameters<typeof useAuthType>;
type UseAuthReturn = ReturnType<typeof useAuthType>;

export const useAuth = jest
  .fn<UseAuthReturn, UseAuthParams>()
  .mockImplementation(() => {
    return {
      user: {
        id: 'test',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        profilePictureUrl: 'https://test.com/profile.png',
      },
      isLoading: false,
      getAccessToken: jest
        .fn<
          ReturnType<UseAuthReturn['getAccessToken']>,
          Parameters<UseAuthReturn['getAccessToken']>
        >()
        .mockImplementation(async () => 'test-token'),
      signIn: jest
        .fn<
          ReturnType<UseAuthReturn['signIn']>,
          Parameters<UseAuthReturn['signIn']>
        >()
        .mockImplementation(async () => ({
          id: 'test',
          email: 'test@test.com',
          firstName: 'Test',
          lastName: 'User',
          profilePictureUrl: 'https://test.com/profile.png',
        })),
      signOut: jest
        .fn<
          ReturnType<UseAuthReturn['signOut']>,
          Parameters<UseAuthReturn['signOut']>
        >()
        .mockImplementation(async () => true),
    };
  });
