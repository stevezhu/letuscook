import { describe, expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';

import HomeScreen from '../index.tsx';

jest.mock('#modules/auth/react/auth-provider.tsx');

describe('HomeScreen', () => {
  test('renders correctly when authenticated', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Welcome back,')).toBeTruthy();
  });
});
