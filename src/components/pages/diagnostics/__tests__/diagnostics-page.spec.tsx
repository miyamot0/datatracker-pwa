// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DiagnosticsPage } from '../diagnostics-page';

// ----- Hoisted mocks -----

const mockCrossOriginCheck = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, size, className, onClick, disabled, asChild }) => (
    <button
      data-testid="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  CardContent: ({ children, className }) => (
    <div data-testid="card-content" className={className}>
      {children}
    </div>
  ),
  CardDescription: ({ children, className }) => (
    <div data-testid="card-description" className={className}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className }) => (
    <div data-testid="card-title" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: ({ className }) => <div data-testid="separator" className={className} />,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) => (
    <div data-testid="page-wrapper" data-label={label} className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/shared-buffer', () => ({
  checkCrossOriginIsolation: mockCrossOriginCheck,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => {
    return classes
      .map((cls) => {
        if (typeof cls === 'string') return cls;
        if (typeof cls === 'object' && cls !== null) {
          return Object.entries(cls)
            .filter(([_, condition]) => condition)
            .map(([className]) => className)
            .join(' ');
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');
  },
}));

const mockRoute = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children, className }) => (
    <a data-testid="link" href={`${to}?slug=${params?.slug}`} className={className}>
      {children}
    </a>
  ),
  createFileRoute: (path: string) => () => ({ component: null, useLoaderData: mockRoute.useLoaderData }),
  Outlet: () => <div data-testid="outlet">Outlet</div>,
  redirect: () => ({}),
  Await: ({ children }: { children: React.ReactNode }) => <div data-testid="await">{children}</div>,
  RouterProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="router-provider">{children}</div>,
  createHashHistory: () => ({}),
  createRouter: () => ({}),
  createRootRouteWithContext: () => () => ({ component: null }),
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@/routes/diagnostics', () => ({
  Route: {
    useLoaderData: () => mockRoute.useLoaderData(),
  },
}));

// ----- Test helpers -----

const createMockQueryClient = (overrides = {}) => ({
  getDefaultOptions: vi.fn().mockReturnValue({
    queries: {
      staleTime: 60000,
      gcTime: 300000,
      ...overrides.queries,
    },
  }),
});

const createMockCrossOriginCheck = (overrides = {}) => ({
  isSupported: true,
  isIsolated: true,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  issues: [],
  recommendations: [],
  ...overrides,
});

const renderDiagnosticsPage = (queryClientOverrides = {}, crossOriginOverrides = {}) => {
  const mockQueryClient = createMockQueryClient(queryClientOverrides);
  const mockCrossOrigin = createMockCrossOriginCheck(crossOriginOverrides);

  mockRoute.useLoaderData.mockReturnValue({
    Settings: {
      CacheBehavior: 'standard' as const,
      TransitionBehavior: 'none' as const,
    },
    queryClient: mockQueryClient,
  });

  mockCrossOriginCheck.mockReturnValue(mockCrossOrigin);

  return render(<DiagnosticsPage />);
};

describe('DiagnosticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.useLoaderData.mockClear();
    mockCrossOriginCheck.mockClear();
  });

  describe('Component Structure', () => {
    it('renders page wrapper with correct label and className', async () => {
      await renderDiagnosticsPage();

      const pageWrapper = page.getByTestId('page-wrapper');
      expect(pageWrapper).toBeInTheDocument();
      expect(pageWrapper).toHaveAttribute('data-label', 'Diagnostics');
      expect(pageWrapper).toHaveClass('flex', 'flex-col', 'gap-6', 'select-none');
    });

    it('renders card with diagnostic title and description', async () => {
      await renderDiagnosticsPage();

      const card = page.getByTestId('card');
      const cardTitle = page.getByTestId('card-title');
      const cardDescription = page.getByTestId('card-description');

      expect(card).toBeInTheDocument();
      expect(cardTitle).toHaveTextContent('Diagnostic and Performance Information');
      expect(cardDescription).toHaveTextContent('Information here presented for debugging purposes');
    });

    it('renders back button in card header', async () => {
      await renderDiagnosticsPage();

      const backButton = page.getByTestId('back-button');
      expect(backButton).toBeInTheDocument();
    });

    it('renders separators between sections', async () => {
      await renderDiagnosticsPage();

      const separators = page.getByTestId('separator').elements();
      expect(separators).toHaveLength(3);
    });
  });

  describe('Cross-Origin Isolation Display', () => {
    it('displays shared array buffer support status when enabled', async () => {
      await renderDiagnosticsPage({}, { isSupported: true });

      const supportText = page.getByText('Shared Array Buffer support:');
      const enabledBadge = supportText.element().nextElementSibling;

      expect(supportText).toBeInTheDocument();
      expect(enabledBadge).toHaveTextContent('Enabled');
      expect(enabledBadge).toHaveClass('bg-green-500');
    });

    it('displays shared array buffer support status when disabled', async () => {
      await renderDiagnosticsPage({}, { isSupported: false });

      const supportText = page.getByText('Shared Array Buffer support:');
      const disabledBadge = supportText.element().nextElementSibling;

      expect(supportText).toBeInTheDocument();
      expect(disabledBadge).toHaveTextContent('Disabled');
      expect(disabledBadge).toHaveClass('bg-red-500');
    });

    it('displays cross-origin isolation status when enabled', async () => {
      await renderDiagnosticsPage({}, { isIsolated: true });

      const isolationText = page.getByText('Cross-Origin Isolation:');
      const enabledBadge = isolationText.element().nextElementSibling;

      expect(isolationText).toBeInTheDocument();
      expect(enabledBadge).toHaveTextContent('Enabled');
      expect(enabledBadge).toHaveClass('bg-green-500');
    });

    it('displays cross-origin isolation status when disabled', async () => {
      await renderDiagnosticsPage({}, { isIsolated: false });

      const isolationText = page.getByText('Cross-Origin Isolation:');
      const disabledBadge = isolationText.element().nextElementSibling;

      expect(isolationText).toBeInTheDocument();
      expect(disabledBadge).toHaveTextContent('Disabled');
      expect(disabledBadge).toHaveClass('bg-red-500');
    });

    it('displays user agent information', async () => {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
      await renderDiagnosticsPage({}, { userAgent });

      const userAgentText = page.getByText('User Agent:');
      const userAgentValue = userAgentText.element().nextElementSibling;

      expect(userAgentText).toBeInTheDocument();
      expect(userAgentValue).toHaveTextContent(userAgent);
    });
  });

  describe('Issues Display', () => {
    it('displays issues count when no issues exist', async () => {
      await renderDiagnosticsPage({}, { issues: [] });

      const issuesText = page.getByText('Issues:');
      const issuesCount = issuesText.element().nextElementSibling;

      expect(issuesText).toBeInTheDocument();
      expect(issuesCount).toHaveTextContent('0');
    });

    it('displays issues count when issues exist', async () => {
      const issues = ['Issue 1', 'Issue 2', 'Issue 3'];
      await renderDiagnosticsPage({}, { issues });

      const issuesText = page.getByText('Issues:');
      const issuesCount = issuesText.element().nextElementSibling;

      expect(issuesText).toBeInTheDocument();
      expect(issuesCount).toHaveTextContent('3');
    });

    it('displays issues list when issues exist', async () => {
      const issues = ['Cross-origin isolation not enabled', 'SharedArrayBuffer not supported'];
      await renderDiagnosticsPage({}, { issues });

      const listItems = page.getByRole('listitem').elements();

      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent('Cross-origin isolation not enabled');
      expect(listItems[1]).toHaveTextContent('SharedArrayBuffer not supported');
    });

    it('does not display issues list when no issues exist', async () => {
      await renderDiagnosticsPage({}, { issues: [] });

      const listItems = page.getByRole('listitem').elements();
      expect(listItems).toHaveLength(0);
    });
  });

  describe('Recommendations Display', () => {
    it('displays recommendations count when no recommendations exist', async () => {
      await renderDiagnosticsPage({}, { recommendations: [] });

      const recommendationsText = page.getByText('Recommendations:');
      const recommendationsCount = recommendationsText.element().nextElementSibling;

      expect(recommendationsText).toBeInTheDocument();
      expect(recommendationsCount).toHaveTextContent('0');
    });

    it('displays recommendations count when recommendations exist', async () => {
      const recommendations = ['Enable HTTPS', 'Add security headers'];
      await renderDiagnosticsPage({}, { recommendations });

      const recommendationsText = page.getByText('Recommendations:');
      const recommendationsCount = recommendationsText.element().nextElementSibling;

      expect(recommendationsText).toBeInTheDocument();
      expect(recommendationsCount).toHaveTextContent('2');
    });

    it('displays recommendations list when recommendations exist', async () => {
      const recommendations = ['Enable cross-origin isolation', 'Use secure headers'];
      await renderDiagnosticsPage({}, { recommendations });

      const recommendationsList = page.getByRole('list').elements()[0]; // First list (after issues list)
      const listItems = page.getByRole('listitem').elements();

      // Find the recommendations list items (second set)
      const recommendationItems = listItems.slice(-2);
      expect(recommendationItems).toHaveLength(2);
      expect(recommendationItems[0]).toHaveTextContent('Enable cross-origin isolation');
      expect(recommendationItems[1]).toHaveTextContent('Use secure headers');
    });

    it('does not display recommendations list when no recommendations exist', async () => {
      await renderDiagnosticsPage({}, { recommendations: [] });

      const listItems = page.getByRole('listitem').elements();
      expect(listItems).toHaveLength(0);
    });
  });

  describe('Cache and Query Settings Display', () => {
    it('displays caching mode from settings', async () => {
      await renderDiagnosticsPage();

      const cachingText = page.getByText('Caching Mode:');
      const cachingValue = cachingText.element().nextElementSibling;

      expect(cachingText).toBeInTheDocument();
      expect(cachingValue).toHaveTextContent('standard');
    });

    it('displays stale time from query client', async () => {
      await renderDiagnosticsPage({ queries: { staleTime: 120000 } });

      const staleTimeText = page.getByText('Stale Time (ms):');
      const staleTimeValue = staleTimeText.element().nextElementSibling;

      expect(staleTimeText).toBeInTheDocument();
      expect(staleTimeValue).toHaveTextContent('120000 ms');
    });

    it('displays cache time (gcTime) from query client', async () => {
      await renderDiagnosticsPage({ queries: { gcTime: 600000 } });

      const cacheTimeText = page.getByText('Cache Time (ms):');
      const cacheTimeValue = cacheTimeText.element().nextElementSibling;

      expect(cacheTimeText).toBeInTheDocument();
      expect(cacheTimeValue).toHaveTextContent('600000 ms');
    });

    it('handles undefined stale time gracefully', async () => {
      await renderDiagnosticsPage({ queries: { staleTime: undefined } });

      const staleTimeText = page.getByText('Stale Time (ms):');
      const staleTimeValue = staleTimeText.element().nextElementSibling;

      expect(staleTimeText).toBeInTheDocument();
      expect(staleTimeValue).toHaveTextContent('ms');
    });

    it('handles undefined gc time gracefully', async () => {
      await renderDiagnosticsPage({ queries: { gcTime: undefined } });

      const cacheTimeText = page.getByText('Cache Time (ms):');
      const cacheTimeValue = cacheTimeText.element().nextElementSibling;

      expect(cacheTimeText).toBeInTheDocument();
      expect(cacheTimeValue).toHaveTextContent('ms');
    });
  });

  describe('AdaptiveBadge Component Behavior', () => {
    it('applies correct classes for enabled state', async () => {
      await renderDiagnosticsPage({}, { isSupported: true, isIsolated: true });

      const badges = page.getByTestId('badge').elements();
      const enabledBadges = badges.filter((badge) => badge.textContent === 'Enabled');

      expect(enabledBadges).toHaveLength(2);
      enabledBadges.forEach((badge) => {
        expect(badge).toHaveClass(
          'bg-green-500',
          'text-white',
          'hover:bg-green-500',
          'cursor-default',
          'select-none',
          'whitespace-nowrap',
        );
      });
    });

    it('applies correct classes for disabled state', async () => {
      await renderDiagnosticsPage({}, { isSupported: false, isIsolated: false });

      const badges = page.getByTestId('badge').elements();
      const disabledBadges = badges.filter((badge) => badge.textContent === 'Disabled');

      expect(disabledBadges).toHaveLength(2);
      disabledBadges.forEach((badge) => {
        expect(badge).toHaveClass(
          'bg-red-500',
          'hover:bg-red-500',
          'text-white',
          'cursor-default',
          'select-none',
          'whitespace-nowrap',
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('displays complete diagnostic information with mixed states', async () => {
      const complexState = {
        isSupported: false,
        isIsolated: true,
        userAgent: 'Test Browser Agent',
        issues: ['SharedArrayBuffer not available'],
        recommendations: ['Enable SharedArrayBuffer support', 'Check browser compatibility'],
      };

      await renderDiagnosticsPage({ queries: { staleTime: 30000, gcTime: 180000 } }, complexState);

      // Check mixed badge states
      const badges = page.getByTestId('badge').elements();
      expect(badges[0]).toHaveTextContent('Disabled'); // SharedArrayBuffer
      expect(badges[0]).toHaveClass('bg-red-500');
      expect(badges[1]).toHaveTextContent('Enabled'); // Cross-Origin
      expect(badges[1]).toHaveClass('bg-green-500');

      // Check user agent
      expect(page.getByText('Test Browser Agent')).toBeInTheDocument();

      // Check issues
      const issuesText = page.getByText('Issues:');
      const issuesCountElement = issuesText.element().nextElementSibling;
      expect(issuesCountElement).toHaveTextContent('1'); // Issues count
      expect(page.getByText('SharedArrayBuffer not available')).toBeInTheDocument();

      // Check recommendations
      const recommendationsText = page.getByText('Recommendations:');
      const recommendationsCountElement = recommendationsText.element().nextElementSibling;
      expect(recommendationsCountElement).toHaveTextContent('2'); // Recommendations count
      expect(page.getByText('Enable SharedArrayBuffer support')).toBeInTheDocument();
      expect(page.getByText('Check browser compatibility')).toBeInTheDocument();

      // Check cache settings
      expect(page.getByText('30000 ms')).toBeInTheDocument(); // Stale time
      expect(page.getByText('180000 ms')).toBeInTheDocument(); // GC time
    });

    it('calls checkCrossOriginIsolation on render', async () => {
      await renderDiagnosticsPage();

      expect(mockCrossOriginCheck).toHaveBeenCalledTimes(1);
    });

    it('uses Route.useLoaderData for settings and query client', async () => {
      await renderDiagnosticsPage();

      expect(mockRoute.useLoaderData).toHaveBeenCalledTimes(1);
    });
  });
});
