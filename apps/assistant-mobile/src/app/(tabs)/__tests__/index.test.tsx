import { render } from '@testing-library/react-native';

import HomeScreen from '../index.js';

jest.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

jest.mock('#providers/auth-provider.js', () => ({
  useAuth: () => ({
    user: { id: 'test', email: 'test@test.com' },
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

describe('HomeScreen', () => {
  test('renders correctly when authenticated', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('home placeholder')).toBeTruthy();
  });
});
