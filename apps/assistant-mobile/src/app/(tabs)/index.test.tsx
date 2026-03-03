import { render } from '@testing-library/react-native';

import HomeScreen from './index.js';

// TODO: just an example test to get started, replace with actual tests
describe('HomeScreen', () => {
  test('renders correctly', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('home placeholder')).toBeTruthy();
  });
});
