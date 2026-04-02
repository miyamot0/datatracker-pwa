import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import NavigationBar from '../navigation-bar';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../authorization-status', () => ({
  default: ({ handle }: { handle?: FileSystemDirectoryHandle }) => (
    <span data-testid="auth-status" data-authorized={!!handle}>
      {handle ? 'authorized' : 'not-authorized'}
    </span>
  ),
}));

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;
const defaultSettings = { ...DEFAULT_APPLICATION_SETTINGS };

describe('NavigationBar', () => {
  describe('home breadcrumb', () => {
    it('always renders a Home link to "/"', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink.getAttribute('href')).toBe('/');
    });
  });

  describe('breadcrumbs prop', () => {
    it('renders breadcrumb labels when provided', () => {
      render(
        <NavigationBar
          Settings={defaultSettings}
          Handle={undefined}
          breadcrumbs={[
            { label: 'Groups', to: '/groups' },
            { label: 'Clients', to: '/clients' },
          ]}
        />,
      );
      expect(screen.getByText('Groups')).not.toBeNull();
      expect(screen.getByText('Clients')).not.toBeNull();
    });

    it('renders breadcrumb links with correct hrefs', () => {
      render(
        <NavigationBar
          Settings={defaultSettings}
          Handle={undefined}
          breadcrumbs={[{ label: 'Groups', to: '/dashboard/groups' }]}
        />,
      );
      const link = screen.getByRole('link', { name: 'Groups' });
      expect(link.getAttribute('href')).toBe('/dashboard/groups');
    });

    it('renders no extra links when breadcrumbs is undefined', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const links = screen.getAllByRole('link');
      // Home, Sync, Settings nav buttons — no breadcrumb links
      const hrefs = links.map((l) => l.getAttribute('href'));
      expect(hrefs).not.toContain('/groups');
    });
  });

  describe('label prop', () => {
    it('renders the current page label when provided', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} label="Dashboard" />);
      expect(screen.getByText('Dashboard')).not.toBeNull();
    });

    it('does not render a label element when label is undefined', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      expect(screen.queryByText('Dashboard')).toBeNull();
    });
  });

  describe('handle / authorization', () => {
    it('passes undefined handle to AuthorizationStatus when no handle', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const authStatus = screen.getByTestId('auth-status');
      expect(authStatus.getAttribute('data-authorized')).toBe('false');
    });

    it('passes handle to AuthorizationStatus when handle is provided', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={makeHandle('my-folder')} />);
      const authStatus = screen.getByTestId('auth-status');
      expect(authStatus.getAttribute('data-authorized')).toBe('true');
    });

    it('adds disabled classes to the sync link when handle is undefined', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const syncLink = screen.getByRole('link', { name: /sync/i });
      expect(syncLink.className).toContain('opacity-50');
      expect(syncLink.className).toContain('pointer-events-none');
    });

    it('does not add disabled classes to the sync link when handle is provided', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={makeHandle('my-folder')} />);
      const syncLink = screen.getByRole('link', { name: /sync/i });
      expect(syncLink.className).not.toContain('opacity-50');
    });
  });

  describe('navigation buttons', () => {
    it('renders the Sync button linking to /dashboard/sync', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const syncLink = screen.getByRole('link', { name: /sync/i });
      expect(syncLink.getAttribute('href')).toBe('/dashboard/sync');
    });

    it('renders the Settings button linking to /settings', () => {
      render(<NavigationBar Settings={defaultSettings} Handle={undefined} />);
      const settingsLink = screen.getByRole('link', { name: /settings/i });
      expect(settingsLink.getAttribute('href')).toBe('/settings');
    });
  });

  describe('transition behavior', () => {
    it('renders without error when TransitionBehavior is "none"', () => {
      expect(() =>
        render(<NavigationBar Settings={{ ...defaultSettings, TransitionBehavior: 'none' }} Handle={undefined} />),
      ).not.toThrow();
    });

    it('renders without error when TransitionBehavior is "slide"', () => {
      expect(() =>
        render(<NavigationBar Settings={{ ...defaultSettings, TransitionBehavior: 'slide' }} Handle={undefined} />),
      ).not.toThrow();
    });

    it('renders without error when TransitionBehavior is "fade"', () => {
      expect(() =>
        render(<NavigationBar Settings={{ ...defaultSettings, TransitionBehavior: 'fade' }} Handle={undefined} />),
      ).not.toThrow();
    });
  });
});
