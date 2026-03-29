import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import HomePage from '../home-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';

// ----- Module mocks -----

const mockInstall = vi.hoisted(() => ({ fn: null as (() => void) | null }));
const mockIsMobile = vi.hoisted(() => ({ value: false }));
const mockNavigateFn = vi.hoisted(() => vi.fn());
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToast = vi.hoisted(() => Object.assign(vi.fn(), { promise: vi.fn() }));

vi.mock('react-use-pwa-install', () => ({
  usePWAInstall: () => mockInstall.fn,
}));

vi.mock('@/lib/user-agent', () => ({
  isOnMobilePlatform: () => mockIsMobile.value,
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      children,
      className,
      target,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
      target?: string;
    }) => (
      <a href={to} target={target} className={className}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigateFn,
    useRouter: () => ({ invalidate: mockRouterInvalidate }),
  };
});

vi.mock('../views/img-carousel', () => ({
  default: () => <div data-testid="image-carousel" />,
}));

// ----- Helpers -----

const renderComponent = (overrides: Partial<typeof DEFAULT_APPLICATION_SETTINGS> = {}) =>
  render(
    <HomePage
      Settings={{ ...DEFAULT_APPLICATION_SETTINGS, ...overrides }}
      SaveSettings={vi.fn()}
      SetSettings={vi.fn()}
    />,
  );

// ----- Tests -----

describe('HomePage', () => {
  beforeEach(() => {
    mockInstall.fn = null;
    mockIsMobile.value = false;
    mockToast.mockReset();
    mockNavigateFn.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Branding ----

  describe('branding', () => {
    it('renders the DataTracker heading', () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: 'DataTracker' })).not.toBeNull();
    });

    it('renders the subtitle', () => {
      renderComponent();
      expect(screen.getByText(/Electronic Data Collection Program/i)).not.toBeNull();
    });

    it('renders the ImageCarousel', () => {
      renderComponent();
      expect(screen.getByTestId('image-carousel')).not.toBeNull();
    });
  });

  // ---- Navigation links ----

  describe('navigation links', () => {
    it('renders the Program Documentation link', () => {
      renderComponent();
      const link = screen.getByRole('link', { name: /Program Documentation/i });
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/documentation');
    });

    it('renders the Software Licenses dialog trigger button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Software Licenses/i })).not.toBeNull();
    });
  });

  // ---- Desktop state ----

  describe('desktop display', () => {
    it('renders the Load Application button on desktop', async () => {
      mockIsMobile.value = false;
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Load Application/i })).not.toBeNull();
      });
    });

    it('does not show the mobile unsupported message on desktop', async () => {
      mockIsMobile.value = false;
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText(/Currently Unsupported on Mobile/i)).toBeNull();
      });
    });

    it('renders the Load Application link pointing to /dashboard', async () => {
      mockIsMobile.value = false;
      renderComponent();
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Load Application/i });
        expect(link.getAttribute('href')).toBe('/dashboard');
      });
    });
  });

  // ---- Mobile state ----

  describe('mobile display', () => {
    it('shows the unsupported message on mobile', async () => {
      mockIsMobile.value = true;
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText(/DataTracker is Currently Unsupported on Mobile/i)).not.toBeNull();
      });
    });

    it('does not show the Load Application button on mobile', async () => {
      mockIsMobile.value = true;
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Load Application/i })).toBeNull();
      });
    });
  });

  // ---- Install button ----

  describe('install button', () => {
    it('renders the Install Application button when install function is available', async () => {
      mockIsMobile.value = false;
      mockInstall.fn = vi.fn();
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Install Application/i })).not.toBeNull();
      });
    });

    it('does not render the Install Application button when install is null', async () => {
      mockInstall.fn = null;
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Install Application/i })).toBeNull();
      });
    });

    it('calls the install function when Install Application is clicked', async () => {
      mockIsMobile.value = false;
      const installFn = vi.fn();
      mockInstall.fn = installFn;
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Install Application/i })).not.toBeNull();
      });
      fireEvent.click(screen.getByRole('button', { name: /Install Application/i }));
      expect(installFn).toHaveBeenCalledOnce();
    });
  });

  // ---- Welcome toast ----

  describe('welcome toast', () => {
    it('fires toast for new users (IsReturningUser = false)', () => {
      renderComponent({ IsReturningUser: false });
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining('Welcome!'), expect.any(Object));
    });

    it('does not fire toast for returning users (IsReturningUser = true)', () => {
      renderComponent({ IsReturningUser: true });
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  // ---- Licenses dialog ----

  describe('licenses dialog', () => {
    it('opens the dialog and shows the title on trigger click', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Software Licenses/i }));
      expect(screen.getByText('Open Source Software')).not.toBeNull();
    });

    it('shows license entries with package names in the dialog', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Software Licenses/i }));
      // At least the first entry from licenses.json should be visible
      expect(screen.getByText('@base-ui/react')).not.toBeNull();
    });

    it('renders Link to Repository links for each entry', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Software Licenses/i }));
      const repoLinks = screen.getAllByText('Link to Repository');
      expect(repoLinks.length).toBeGreaterThan(0);
    });

    it('shows the license type for entries', () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Software Licenses/i }));
      expect(screen.getAllByText(/MIT Licensed/i).length).toBeGreaterThan(0);
    });
  });
});
