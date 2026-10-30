import { render, screen } from '@testing-library/react';
import { cloneElement, ComponentProps } from 'react';
import { vi, describe, it, expect } from 'vitest';
import PageWrapperBase from '../page-wrapper';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { FolderHandleContext } from '@/context/folder-context';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';

// Tests rely on renderWithContext to inject Settings when omitted, so expose Settings as optional here.
const PageWrapper = PageWrapperBase as unknown as React.FC<Partial<ComponentProps<typeof PageWrapperBase>>>;

vi.mock('../header/navigation-bar', () => ({
  default: ({
    label,
    breadcrumbs,
    Handle,
  }: {
    label?: string;
    breadcrumbs?: { label: string; to: string }[];
    Handle?: FileSystemDirectoryHandle;
  }) => (
    <nav data-testid="nav-bar" data-has-handle={!!Handle}>
      {breadcrumbs?.map((b) => (
        <span key={b.to}>{b.label}</span>
      ))}
      {label && <span>{label}</span>}
    </nav>
  ),
}));

vi.mock('../footer/footer', () => ({
  default: () => <footer data-testid="layout-footer" />,
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useLocation: () => ({ pathname: '/' }),
  };
});

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

function renderWithContext(
  ui: React.ReactElement<{ Settings?: ApplicationSettingsTypes }>,
  { handle, settings }: { handle?: FileSystemDirectoryHandle; settings?: Partial<ApplicationSettingsTypes> } = {},
) {
  const resolvedSettings = { ...DEFAULT_APPLICATION_SETTINGS, ...settings };
  const element = ui.props.Settings ? ui : cloneElement(ui, { Settings: resolvedSettings });
  return render(
    <FolderHandleContext.Provider
      value={{
        handle,
        getHandle: () => handle,
        setHandle: vi.fn(),
        settings: resolvedSettings,
        getSettings: () => resolvedSettings,
        setSettings: vi.fn(),
        saveSettings: vi.fn(),
        isInitialized: true,
        getIsInitialized: () => true,
        setIsInitialized: vi.fn(),
      }}
    >
      {element}
    </FolderHandleContext.Provider>,
  );
}

describe('PageWrapper', () => {
  describe('children', () => {
    it('renders children inside the main element', () => {
      renderWithContext(
        <PageWrapper>
          <p>Hello World</p>
        </PageWrapper>,
      );
      expect(screen.getByText('Hello World')).not.toBeNull();
    });
  });

  describe('NavigationBar', () => {
    it('renders the nav bar by default', () => {
      renderWithContext(<PageWrapper>content</PageWrapper>);
      expect(screen.getByTestId('nav-bar')).not.toBeNull();
    });

    it('hides the nav bar when HideNavbar is true', () => {
      renderWithContext(<PageWrapper HideNavbar>content</PageWrapper>);
      expect(screen.queryByTestId('nav-bar')).toBeNull();
    });

    it('passes breadcrumbs to NavigationBar', () => {
      renderWithContext(<PageWrapper breadcrumbs={[{ label: 'Groups', to: '/groups' }]}>content</PageWrapper>);
      expect(screen.getByText('Groups')).not.toBeNull();
    });

    it('passes label to NavigationBar', () => {
      renderWithContext(<PageWrapper label="Dashboard">content</PageWrapper>);
      expect(screen.getByText('Dashboard')).not.toBeNull();
    });

    it('passes handle from context to NavigationBar', () => {
      renderWithContext(<PageWrapper>content</PageWrapper>, { handle: makeHandle('my-folder') });
      expect(screen.getByTestId('nav-bar').getAttribute('data-has-handle')).toBe('true');
    });
  });

  describe('LayoutFooter', () => {
    it('renders the footer by default', () => {
      renderWithContext(<PageWrapper>content</PageWrapper>);
      expect(screen.getByTestId('layout-footer')).not.toBeNull();
    });

    it('hides the footer when HideFooter is true', () => {
      renderWithContext(<PageWrapper HideFooter>content</PageWrapper>);
      expect(screen.queryByTestId('layout-footer')).toBeNull();
    });

    it('hides the footer when ApplicationFooterDisplay is "Disabled" in context settings', () => {
      renderWithContext(<PageWrapper>content</PageWrapper>, {
        settings: { ApplicationFooterDisplay: 'Disabled' },
      });
      expect(screen.queryByTestId('layout-footer')).toBeNull();
    });

    it('shows the footer when ApplicationFooterDisplay is "Standard"', () => {
      renderWithContext(<PageWrapper>content</PageWrapper>, {
        settings: { ApplicationFooterDisplay: 'Standard' },
      });
      expect(screen.getByTestId('layout-footer')).not.toBeNull();
    });
  });

  describe('Settings override', () => {
    it('uses the Settings prop over context settings', () => {
      const overrideSettings: ApplicationSettingsTypes = {
        ...DEFAULT_APPLICATION_SETTINGS,
        ApplicationFooterDisplay: 'Disabled',
      };
      // Context has footer enabled, but prop disables it
      renderWithContext(<PageWrapper Settings={overrideSettings}>content</PageWrapper>, {
        settings: { ApplicationFooterDisplay: 'Standard' },
      });
      expect(screen.queryByTestId('layout-footer')).toBeNull();
    });
  });

  describe('className and layout', () => {
    it('applies extra className to the main element', () => {
      const { container } = renderWithContext(<PageWrapper className="test-class">content</PageWrapper>);
      const main = container.querySelector('main');
      expect(main?.className).toContain('test-class');
    });

    it('applies wide max-width class when DisplaySize is "wide"', () => {
      const { container } = renderWithContext(
        <PageWrapper Settings={{ ...DEFAULT_APPLICATION_SETTINGS, DisplaySize: 'wide' }}>content</PageWrapper>,
      );
      expect(container.querySelector('main')?.className).toContain('max-w-360');
    });

    it('applies extra-wide max-width class when DisplaySize is "extra-wide"', () => {
      const { container } = renderWithContext(
        <PageWrapper Settings={{ ...DEFAULT_APPLICATION_SETTINGS, DisplaySize: 'extra-wide' }}>content</PageWrapper>,
      );
      expect(container.querySelector('main')?.className).toContain('max-w-[106rem]');
    });

    it('applies full-screen classes when SessionDisplay is "FullScreen"', () => {
      const { container } = renderWithContext(
        <PageWrapper Settings={{ ...DEFAULT_APPLICATION_SETTINGS, SessionDisplay: 'FullScreen' }}>content</PageWrapper>,
      );
      const main = container.querySelector('main');
      expect(main?.className).toContain('max-w-full');
      expect(main?.className).toContain('w-full');
    });
  });
});
