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
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

vi.mock('../views/img-carousel', () => ({
  default: () => <div data-testid="image-carousel">Carousel</div>,
}));

const mockRoute = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className} onClick={(e) => e.preventDefault()}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useRouter: () => ({ invalidate: mockInvalidate }),
  useLocation: () => ({ pathname: '/' }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  createFileRoute: (path: string) => () => ({ component: null, useLoaderData: mockRoute.useLoaderData }),
  createRootRouteWithContext: () => () => ({ component: null }),
  redirect: () => ({}),
  Await: ({ children }: { children: React.ReactNode }) => <div data-testid="await">{children}</div>,
  RouterProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="router-provider">{children}</div>,
  createHashHistory: () => ({}),
  createRouter: () => ({}),
}));

vi.mock('@/routes/index', () => ({
  Route: {
    useLoaderData: () => mockRoute.useLoaderData(),
    update: (config: any) => config,
  },
}));

// Mock the entire route tree to avoid having to mock every route
vi.mock('@/routeTree.gen', () => ({
  routeTree: {},
}));

vi.mock('@/types/transitions', () => ({
  TRANSITION_CLASSES: {
    fade: ['fade-enter', 'fade-exit'],
    slide: ['slide-enter', 'slide-exit'],
    none: [],
  },
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-provider">{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
}));

import HomePage from '../home-page';

// Vite build-time globals not defined in vitest
vi.stubGlobal('BUILD_VERSION', '0.5.6');
vi.stubGlobal('BUILD_DATE', '03/29/2026');
vi.stubGlobal('MODALITY', '');

const makeSettings = (isReturningUser: boolean) =>
  ({
    IsReturningUser: isReturningUser,
    TransitionBehavior: 'fade', // Add default transition behavior
  }) as any;

const renderHome = (isReturningUser = true, saveSettings = vi.fn(), setSettings = vi.fn()) => {
  mockRoute.useLoaderData.mockReturnValue({
    Settings: makeSettings(isReturningUser),
    SaveSettings: saveSettings,
    SetSettings: setSettings,
  });

  return render(<HomePage />);
};

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
    mockRoute.useLoaderData.mockClear();
  });

  it('renders desktop actions including load and install buttons', async () => {
    mockIsOnMobilePlatform.mockReturnValue(false);
    await renderHome(true);

    await expect.element(page.getByRole('heading', { name: 'DataTracker' })).toBeInTheDocument();
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
