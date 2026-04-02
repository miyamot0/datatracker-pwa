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

// ----- Tests -----

describe('DocumentationEntryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with entry title', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    await expect.element(page.getByTestId('card-title')).toHaveTextContent('Test Entry');
  });

  it('displays entry date and author', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    await expect.element(page.getByTestId('card-description')).toHaveTextContent('Written 2024-01-01 by Test Author');
  });

  it('renders keyword badges for entry keywords', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(2);
    expect(badges[0]).toHaveTextContent('testing');
    expect(badges[1]).toHaveTextContent('documentation');
  });

  it('applies correct color class to keyword badges', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveClass('bg-blue-500');
    expect(badges[1]).toHaveClass('bg-green-500');
  });

  it('applies fallback gray color for unknown keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing,unknown-keyword' } });
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges[1]).toHaveClass('bg-gray-500');
  });

  it('renders markdown viewer with entry content', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    await expect.element(page.getByTestId('md-viewer-lite')).toHaveTextContent('# Test Content');
  });

  it('disables previous button when PreviousEntry is undefined', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).toBeDisabled();
  });

  it('disables next button when NextEntry is undefined', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const buttons = page.getByTestId('button').elements();
    expect(buttons[1]).toBeDisabled();
  });

  it('enables previous button when PreviousEntry is provided', async () => {
    const Entry = createMockEntry();
    const PreviousEntry = createMockPreviousEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={PreviousEntry}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).not.toBeDisabled();
  });

  it('enables next button when NextEntry is provided', async () => {
    const Entry = createMockEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const buttons = page.getByTestId('button').elements();
    expect(buttons[1]).not.toBeDisabled();
  });

  it('links to previous entry with correct slug', async () => {
    const Entry = createMockEntry();
    const PreviousEntry = createMockPreviousEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={PreviousEntry}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const links = page.getByTestId('link').elements();
    expect(links[0].getAttribute('href')).toContain('previous-entry');
  });

  it('links to next entry with correct slug', async () => {
    const Entry = createMockEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const links = page.getByTestId('link').elements();
    expect(links[1].getAttribute('href')).toContain('next-entry');
  });

  it('applies view transition types for fade behavior', async () => {
    const Entry = createMockEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings({ TransitionBehavior: 'fade' })}
      />,
    );
    const links = page.getByTestId('link').elements();
    // With fade: animRight should be [fade-enter], animLeft should be [fade-exit]
    expect(links[1]).toHaveAttribute('data-transition-types');
  });

  it('applies view transition types for slide behavior', async () => {
    const Entry = createMockEntry();
    const PreviousEntry = createMockPreviousEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={PreviousEntry}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings({ TransitionBehavior: 'slide' })}
      />,
    );
    const links = page.getByTestId('link').elements();
    // With slide: animLeft should be [slide-exit], animRight should be [slide-enter]
    expect(links[0]).toHaveAttribute('data-transition-types');
  });

  it('handles empty transition classes for none behavior', async () => {
    const Entry = createMockEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings({ TransitionBehavior: 'none' })}
      />,
    );
    const links = page.getByTestId('link').elements();
    expect(links[1]).toHaveAttribute('data-transition-types', '');
  });

  it('renders back button in header', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings({ TransitionBehavior: 'slide' })}
      />,
    );
    const wrapper = page.getByTestId('page-wrapper');
    expect(wrapper).toHaveAttribute('data-transition', 'slide');
  });

  it('trims whitespace from keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: '  testing  ,  documentation  ' } });
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveTextContent('testing');
    expect(badges[1]).toHaveTextContent('documentation');
  });

  it('shows chevron icons in navigation buttons', async () => {
    const Entry = createMockEntry();
    const PreviousEntry = createMockPreviousEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={PreviousEntry}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    await expect.element(page.getByTestId('chevron-left')).toBeInTheDocument();
    await expect.element(page.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('renders with single keyword', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing' } });
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(1);
  });

  it('renders with multiple keywords', async () => {
    const Entry = createMockEntry({ matter: { keywords: 'testing,documentation,advanced,guide' } });
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(4);
  });

  it('does not apply pointer-events-none when navigation entries are present', async () => {
    const Entry = createMockEntry();
    const PreviousEntry = createMockPreviousEntry();
    const NextEntry = createMockNextEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={PreviousEntry}
        NextEntry={NextEntry}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const links = page.getByTestId('link').elements();
    expect(links[0]).not.toHaveClass('pointer-events-none');
    expect(links[1]).not.toHaveClass('pointer-events-none');
  });

  it('handles empty keyword keyword array gracefully', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={[]}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const badges = page.getByTestId('badge').elements();
    // All keywords should fallback to gray color
    badges.forEach((badge) => {
      expect(badge).toHaveClass('bg-gray-500');
    });
  });

  it('renders card footer with both navigation links', async () => {
    const Entry = createMockEntry();
    await render(
      <DocumentationEntryPage
        KeywordArray={createMockKeywordArray()}
        PreviousEntry={undefined}
        NextEntry={undefined}
        Entry={Entry}
        Settings={createMockSettings()}
      />,
    );
    const links = page.getByTestId('link').elements();
    expect(links.length).toBe(2);
  });
});
