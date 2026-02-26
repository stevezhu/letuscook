import { render } from '@testing-library/react-native';

import UiTestScreen from '../capture.js';

describe('UiTestScreen', () => {
  test('renders correctly', async () => {
    const { getByText } = await render(<UiTestScreen />);

    expect(getByText('UI Test Screen')).toBeTruthy();
  });
});
