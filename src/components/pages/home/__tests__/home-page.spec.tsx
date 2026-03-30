import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInstall = vi.hoisted(() => vi.fn());
const mockUsePWAInstall = vi.hoisted(() => vi.fn());
const mockToast = vi.hoisted(() => vi.fn());
const mockIsOnMobilePlatform = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());
const mockInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('react-use-pwa-install', () => ({
  usePWAInstall: () => mockUsePWAInstall(),
}));

vi.mock('@/lib/user-agent', () => ({
  isOnMobilePlatform: mockIsOnMobilePlatform,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('../views/img-carousel', () => ({
  default: () => <div data-testid="image-carousel">Carousel</div>,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouter: () => ({ invalidate: mockInvalidate }),
}));

import HomePage from '../home-page';

const makeSettings = (isReturningUser: boolean) =>
  ({
    ...({} as any),
    IsReturningUser: isReturningUser,
  }) as any;

const renderHome = (isReturningUser = true, saveSettings = vi.fn(), setSettings = vi.fn()) =>
  render(<HomePage Settings={makeSettings(isReturningUser)} SaveSettings={saveSettings} SetSettings={setSettings} />);

describe('HomePage', () => {
  beforeEach(() => {
    mockInstall.mockReset();
    mockUsePWAInstall.mockReset();
    mockToast.mockReset();
    mockIsOnMobilePlatform.mockReset();
    mockNavigate.mockReset();
    mockInvalidate.mockReset();
    mockInvalidate.mockResolvedValue(undefined);
    mockUsePWAInstall.mockReturnValue(mockInstall);
  });

  it('renders desktop actions including load and install buttons', async () => {
    mockIsOnMobilePlatform.mockReturnValue(false);
    await renderHome(true);

    await expect.element(page.getByText('DataTracker')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Load Application' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Install Application' })).toBeInTheDocument();
    await expect.element(page.getByTestId('image-carousel')).toBeInTheDocument();
  });

  it('renders mobile unsupported message and hides desktop entry button', async () => {
    mockIsOnMobilePlatform.mockReturnValue(true);
    await renderHome(true);

    await expect.element(page.getByText('DataTracker is Currently Unsupported on Mobile')).toBeInTheDocument();
    expect(await page.getByRole('button', { name: 'Load Application' }).query()).toBeNull();
  });

  it('omits install button when install hook returns null', async () => {
    mockIsOnMobilePlatform.mockReturnValue(false);
    mockUsePWAInstall.mockReturnValue(null);

    await renderHome(true);

    expect(await page.getByRole('button', { name: 'Install Application' }).query()).toBeNull();
  });

  it('shows welcome toast for first-time users and executes toast callbacks', async () => {
    mockIsOnMobilePlatform.mockReturnValue(false);
    const saveSettings = vi.fn();
    const setSettings = vi.fn();
    await renderHome(false, saveSettings, setSettings);

    await vi.waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    const toastOptions = mockToast.mock.calls[0]?.[1];
    expect(toastOptions.action.label).toBe('Read Docs');

    toastOptions.action.onClick();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/documentation' });

    await toastOptions.onAutoClose();
    expect(setSettings).toHaveBeenCalledWith(expect.objectContaining({ IsReturningUser: true }));
    expect(saveSettings).toHaveBeenCalledWith(expect.objectContaining({ IsReturningUser: true }));
    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('does not show welcome toast for returning users', async () => {
    mockIsOnMobilePlatform.mockReturnValue(false);
    await renderHome(true);

    expect(mockToast).not.toHaveBeenCalled();
  });
});
