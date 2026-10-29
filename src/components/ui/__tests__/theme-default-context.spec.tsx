import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

import { useTheme } from '../theme-provider';

function NoProviderProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <p data-testid="theme">{theme}</p>
      <button onClick={() => setTheme('dark')}>Set dark</button>
    </>
  );
}

describe('useTheme without a ThemeProvider', () => {
  it('falls back to the system theme and ignores setTheme', async () => {
    await render(<NoProviderProbe />);

    await page.getByRole('button', { name: 'Set dark' }).click();
    await expect.element(page.getByTestId('theme')).toHaveTextContent('system');
  });
});
