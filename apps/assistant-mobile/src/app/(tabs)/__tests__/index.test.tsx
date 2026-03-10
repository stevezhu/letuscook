import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';

import * as authContext from '#modules/auth/auth-context.tsx';

import HomeScreen from '../index.tsx';

jest.mock<typeof authContext>('#modules/auth/auth-context.tsx', () => {
  const original = jest.requireActual<typeof authContext>(
    '#modules/auth/auth-context.tsx',
  );
  return {
    ...original,
    useAuth: (): authContext.AuthContextValue => ({
      user: {
        id: 'test',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        profilePictureUrl: 'https://test.com/profile.png',
      },
      loading: false,
      signIn: jest
        .fn<authContext.AuthContextValue['signIn']>()
        .mockImplementation(async () => ({ success: true })),
      signOut: jest
        .fn<authContext.AuthContextValue['signOut']>()
        .mockImplementation(async () => ({ success: true })),
    }),
  };
});

describe('HomeScreen', () => {
  test('renders correctly when authenticated', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Welcome back,')).toBeTruthy();
  });
});
