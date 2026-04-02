// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockMdViewerSource = vi.hoisted(() => ({ source: '' }));

// ----- Module mocks -----

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
  CardDescription: ({ children }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
  CardFooter: ({ children, className }) => (
    <div data-testid="card-footer" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, className }) => (
    <button data-testid="button" disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  ChevronLeft: () => <span data-testid="chevron-left">LEFT</span>,
  ChevronRight: () => <span data-testid="chevron-right">RIGHT</span>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

const mockRoute = vi.hoisted(() => ({
  useLoaderData: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children, className, viewTransition }) => (
    <a
      data-testid="link"
      href={`${to}?slug=${params?.slug}`}
      className={className}
      data-transition-types={viewTransition?.types?.join(',')}
      data-class-string={className}
    >
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
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
}));

// Mock the route that provides the data
vi.mock('@/routes/documentation/$slug', () => ({
  Route: {
    useLoaderData: () => mockRoute.useLoaderData(),
  },
}));

vi.mock('@/components/pages/documentation/views/md-viewer-lite', () => ({
  MdViewerLite: ({ source }) => <div data-testid="md-viewer-lite">{source}</div>,
}));

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children, breadcrumbs, label, Settings }) => (
    <div data-testid="page-wrapper" data-label={label} data-transition={Settings?.TransitionBehavior}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/breadcrumb-entries', () => ({
  BuildDocumentationBreadcrumb: () => ({ name: 'Documentation', href: '/documentation' }),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

vi.mock('@/types/transitions', () => ({
  TRANSITION_CLASSES: {
    fade: ['fade-enter', 'fade-exit'],
    slide: ['slide-enter', 'slide-exit'],
    none: [],
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

// Vite build-time globals not defined in vitest
vi.stubGlobal('BUILD_VERSION', '0.5.6');
vi.stubGlobal('BUILD_DATE', '03/29/2026');
vi.stubGlobal('MODALITY', '');

// ----- Import under test -----

import DocumentationEntryPage from '../documentation-entry-page';

// ----- Helpers -----

const createMockEntry = (overrides = {}) => ({
  matter: {
    title: 'Test Entry',
    date: '2024-01-01',
    author: 'Test Author',
    keywords: 'testing,documentation',
    ...overrides.matter,
  },
  value: '# Test Content\n\nThis is test markdown content.',
  ...overrides,
});

const createMockPreviousEntry = (overrides = {}) => ({
  filename: 'previous-entry.md',
  index: 1,
  title: 'Previous Entry',
  description: 'Previous description',
  date: '2024-01-01',
  author: 'Author',
  keywords: 'testing',
  ...overrides,
});

const createMockNextEntry = (overrides = {}) => ({
  filename: 'next-entry.md',
  index: 3,
  title: 'Next Entry',
  description: 'Next description',
  date: '2024-01-02',
  author: 'Author',
  keywords: 'documentation',
  ...overrides,
});

const createMockKeywordArray = () => [
  { Keyword: 'testing', Color: 'bg-blue-500' },
  { Keyword: 'documentation', Color: 'bg-green-500' },
];

const createMockSettings = (overrides = {}) => ({
  TransitionBehavior: 'fade',
  ...overrides,
});

const renderEntryPage = (
  entry = createMockEntry(),
  keywordArray = createMockKeywordArray(),
  previousEntry = undefined,
  nextEntry = undefined,
  settings = createMockSettings(),
) => {
  mockRoute.useLoaderData.mockReturnValue({
    KeywordArray: keywordArray,
    PreviousEntry: previousEntry,
    NextEntry: nextEntry,
    Entry: entry,
    Settings: settings,
  });

  return render(<DocumentationEntryPage />);
};

describe('DocumentationEntryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.useLoaderData.mockClear();
  });

  it('renders card with entry title', async () => {
    await renderEntryPage();
    await expect.element(page.getByTestId('card-title')).toHaveTextContent('Test Entry');
  });

  it('displays entry date and author', async () => {
    await renderEntryPage();
    await expect.element(page.getByTestId('card-description')).toHaveTextContent('Written 2024-01-01 by Test Author');
  });

  it('renders keyword badges for entry keywords', async () => {
    await renderEntryPage();
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(2);
    expect(badges[0]).toHaveTextContent('testing');
    expect(badges[1]).toHaveTextContent('documentation');
  });

  it('applies correct color class to keyword badges', async () => {
    await renderEntryPage();
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveClass('bg-blue-500');
    expect(badges[1]).toHaveClass('bg-green-500');
  });

  it('applies fallback gray color for unknown keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing,unknown-keyword' } });
    await renderEntryPage(Entry);
    const badges = page.getByTestId('badge').elements();
    expect(badges[1]).toHaveClass('bg-gray-500');
  });

  it('renders markdown viewer with entry content', async () => {
    await renderEntryPage();
    await expect.element(page.getByTestId('md-viewer-lite')).toHaveTextContent('# Test Content');
  });

  it('disables previous button when PreviousEntry is undefined', async () => {
    await renderEntryPage();
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button when NextEntry is undefined', async () => {
    await renderEntryPage();
    const buttons = page.getByTestId('button').elements();
    expect(buttons[1]).toBeDisabled();
  });

  it('enables previous button when PreviousEntry is provided', async () => {
    const PreviousEntry = createMockPreviousEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), PreviousEntry);
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).not.toBeDisabled();
  });

  it('enables next button when NextEntry is provided', async () => {
    const NextEntry = createMockNextEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), undefined, NextEntry);
    const buttons = page.getByTestId('button').elements();
    expect(buttons[1]).not.toBeDisabled();
  });

  it('links to previous entry with correct slug', async () => {
    const PreviousEntry = createMockPreviousEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), PreviousEntry);
    const links = page.getByTestId('link').elements();
    expect(links[0].getAttribute('href')).toContain('previous-entry');
  });

  it('links to next entry with correct slug', async () => {
    const NextEntry = createMockNextEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), undefined, NextEntry);
    const links = page.getByTestId('link').elements();
    expect(links[1].getAttribute('href')).toContain('next-entry');
  });

  it('applies view transition types for fade behavior', async () => {
    const NextEntry = createMockNextEntry();
    await renderEntryPage(
      createMockEntry(),
      createMockKeywordArray(),
      undefined,
      NextEntry,
      createMockSettings({ TransitionBehavior: 'fade' }),
    );
    const links = page.getByTestId('link').elements();
    // With fade: animRight should be [fade-enter], animLeft should be [fade-exit]
    expect(links[1]).toHaveAttribute('data-transition-types');
  });

  it('applies view transition types for slide behavior', async () => {
    const PreviousEntry = createMockPreviousEntry();
    await renderEntryPage(
      createMockEntry(),
      createMockKeywordArray(),
      PreviousEntry,
      undefined,
      createMockSettings({ TransitionBehavior: 'slide' }),
    );
    const links = page.getByTestId('link').elements();
    // With slide: animLeft should be [slide-exit], animRight should be [slide-enter]
    expect(links[0]).toHaveAttribute('data-transition-types');
  });

  it('handles empty transition classes for none behavior', async () => {
    const NextEntry = createMockNextEntry();
    await renderEntryPage(
      createMockEntry(),
      createMockKeywordArray(),
      undefined,
      NextEntry,
      createMockSettings({ TransitionBehavior: 'none' }),
    );
    const links = page.getByTestId('link').elements();
    expect(links[1]).toHaveAttribute('data-transition-types', '');
  });

  it('renders back button in header', async () => {
    await renderEntryPage(
      createMockEntry(),
      createMockKeywordArray(),
      undefined,
      undefined,
      createMockSettings({ TransitionBehavior: 'slide' }),
    );
    const wrapper = page.getByTestId('page-wrapper');
    expect(wrapper).toHaveAttribute('data-transition', 'slide');
  });

  it('trims whitespace from keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: '  testing  ,  documentation  ' } });
    await renderEntryPage(Entry);
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveTextContent('testing');
    expect(badges[1]).toHaveTextContent('documentation');
  });

  it('shows chevron icons in navigation buttons', async () => {
    const PreviousEntry = createMockPreviousEntry();
    const NextEntry = createMockNextEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), PreviousEntry, NextEntry);
    await expect.element(page.getByTestId('chevron-left')).toBeInTheDocument();
    await expect.element(page.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('renders with single keyword', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing' } });
    await renderEntryPage(Entry);
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(1);
  });

  it('renders with multiple keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing,documentation,advanced,guide' } });
    await renderEntryPage(Entry);
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(4);
  });

  it('does not apply pointer-events-none when navigation entries are present', async () => {
    const PreviousEntry = createMockPreviousEntry();
    const NextEntry = createMockNextEntry();
    await renderEntryPage(createMockEntry(), createMockKeywordArray(), PreviousEntry, NextEntry);
    const links = page.getByTestId('link').elements();
    expect(links[0]).not.toHaveClass('pointer-events-none');
    expect(links[1]).not.toHaveClass('pointer-events-none');
  });

  it('handles empty keyword keyword array gracefully', async () => {
    await renderEntryPage(createMockEntry(), []);
    const badges = page.getByTestId('badge').elements();
    // All keywords should fallback to gray color
    badges.forEach((badge) => {
      expect(badge).toHaveClass('bg-gray-500');
    });
  });

  it('renders card footer with both navigation links', async () => {
    await renderEntryPage();
    const links = page.getByTestId('link').elements();
    expect(links.length).toBe(2);
  });
});
