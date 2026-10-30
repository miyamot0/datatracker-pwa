import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import '@/styles/globals.css';
import { ThemeProvider, useTheme } from '../theme-provider';
import { Toaster } from '../sonner';
import { toast } from 'sonner';

function ThemeProbe() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <p data-testid="theme">{theme}</p>
      <button onClick={() => setTheme('dark')}>Go dark</button>
      <button onClick={() => setTheme('light')}>Go light</button>
    </>
  );
}

function ensureThemeColorMeta() {
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', '#000000');
    document.head.appendChild(meta);
  }
  return meta;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    ensureThemeColorMeta();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('defaults to the system theme and applies the matching class', async () => {
    await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await expect.element(page.getByTestId('theme')).toHaveTextContent('system');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    expect(document.documentElement.classList.contains(systemDark ? 'dark' : 'light')).toBe(true);
  });

  it('reads the initial theme from localStorage under the given key', async () => {
    localStorage.setItem('custom-key', 'light');
    await render(
      <ThemeProvider storageKey="custom-key">
        <ThemeProbe />
      </ThemeProvider>,
    );
    await expect.element(page.getByTestId('theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('honors defaultTheme when nothing is stored', async () => {
    await render(
      <ThemeProvider defaultTheme="dark">
        <ThemeProbe />
      </ThemeProvider>,
    );
    await expect.element(page.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('persists a new theme, updates the root class, and sets the theme-color meta', async () => {
    await render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
    await page.getByRole('button', { name: 'Go dark' }).click();

    await expect.element(page.getByTestId('theme')).toHaveTextContent('dark');
    expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#333333');

    await page.getByRole('button', { name: 'Go light' }).click();
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#F2F2F2');
  });

  it('falls back to the default context outside a provider', async () => {
    await render(<ThemeProbe />);
    await expect.element(page.getByTestId('theme')).toHaveTextContent('system');
    await page.getByRole('button', { name: 'Go dark' }).click();
    await expect.element(page.getByTestId('theme')).toHaveTextContent('system');
  });
});

describe('Toaster', () => {
  it('renders inside the theme provider and shows toasts', async () => {
    await render(
      <ThemeProvider>
        <Toaster />
        <button onClick={() => toast('Saved successfully')}>Notify</button>
      </ThemeProvider>,
    );
    await page.getByRole('button', { name: 'Notify' }).click();
    await expect.element(page.getByText('Saved successfully')).toBeVisible();
  });
});
