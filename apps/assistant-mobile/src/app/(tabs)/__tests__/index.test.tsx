import { describe, jest, test } from '@jest/globals';
import { renderRouter, screen } from 'expo-router/testing-library';

jest.mock('#modules/auth/react/auth-provider.tsx');
// jest.mock('expo-router', () => ({
//   useRouter: jest.fn(),
// }));

describe('HomeScreen', () => {
  test('renders correctly when authenticated', async () => {
    renderRouter();

    console.log(screen.toJSON());
    // const { getByText } = await render(<HomeScreen />);

    // expect(getByText('Welcome back,')).toBeTruthy();
  });
});
