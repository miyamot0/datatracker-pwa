// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

// ----- Module mocks -----

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }) => (
    <span data-testid="badge" className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, variant, className, size }) => (
    <button data-testid="button" data-variant={variant} className={className} data-size={size}>
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
  CardDescription: ({ children }) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children, className }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  ),
  CardTitle: ({ children }) => <div data-testid="card-title">{children}</div>,
}));

vi.mock('lucide-react', () => ({
  BookIcon: () => <span data-testid="book-icon">BOOK</span>,
  ChevronRight: () => <span data-testid="chevron-right">RIGHT</span>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children, className }) => (
    <a data-testid="link" href={`${to}?slug=${params?.slug}`} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// ----- Import under test -----

import DocumentationListingPage from '../documentation-listing-page';

// ----- Helpers -----

const createMockEntry = (overrides = {}, index = 1) => ({
  index,
  filename: `entry-${index}.md`,
  title: `Entry ${index}`,
  description: `Description for entry ${index}`,
  date: '2024-01-01',
  author: 'Test Author',
  keywords: 'testing,documentation',
  ...overrides,
});

const createMockKeywordArray = () => [
  { Keyword: 'testing', Color: 'bg-blue-500' },
  { Keyword: 'documentation', Color: 'bg-green-500' },
  { Keyword: 'advanced', Color: 'bg-red-500' },
];

// ----- Tests -----

describe('DocumentationListingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with documentation listing title', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByTestId('card-title')).toHaveTextContent('Program Documentation');
  });

  it('renders card description', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect
      .element(page.getByTestId('card-description'))
      .toHaveTextContent('Guidelines and Instructions for using DataTracker');
  });

  it('renders back button in header', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByTestId('back-button')).toBeInTheDocument();
  });

  it('renders single entry', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText('1. Entry 1')).toBeInTheDocument();
    await expect.element(page.getByText('Description for entry 1')).toBeInTheDocument();
  });

  it('renders multiple entries with correct indices', async () => {
    const FrontMatter = [createMockEntry({}, 1), createMockEntry({}, 2), createMockEntry({}, 3)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText('1. Entry 1')).toBeInTheDocument();
    await expect.element(page.getByText('2. Entry 2')).toBeInTheDocument();
    await expect.element(page.getByText('3. Entry 3')).toBeInTheDocument();
  });

  it('displays entry date and author for each entry', async () => {
    const FrontMatter = [
      createMockEntry({ date: '2024-01-05', author: 'Alice' }, 1),
      createMockEntry({ date: '2024-01-10', author: 'Bob' }, 2),
    ];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText('Written 2024-01-05 by Alice')).toBeInTheDocument();
    await expect.element(page.getByText('Written 2024-01-10 by Bob')).toBeInTheDocument();
  });

  it('renders keyword badges for each entry keywords', async () => {
    const FrontMatter = [
      createMockEntry({ keywords: 'testing,documentation' }, 1),
      createMockEntry({ keywords: 'advanced,documentation' }, 2),
    ];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBeGreaterThanOrEqual(4);
  });

  it('applies correct color classes to badges from keyword array', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'testing,advanced' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveClass('bg-blue-500');
    expect(badges[1]).toHaveClass('bg-red-500');
  });

  it('applies fallback gray color to unknown keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'unknown-keyword,testing' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveClass('bg-gray-500');
    expect(badges[1]).toHaveClass('bg-blue-500');
  });

  it('trims whitespace from keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: '  testing  ,  documentation  ' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveTextContent('testing');
    expect(badges[1]).toHaveTextContent('documentation');
  });

  it('filters out empty keywords after trimming', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'testing,,documentation,' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    // Should only render 'testing' and 'documentation', not empty strings
    expect(badges.filter((b) => b.textContent.trim().length > 0).length).toBe(2);
  });

  it('provides read more link for each entry', async () => {
    const FrontMatter = [createMockEntry({}, 1), createMockEntry({}, 2)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const links = page.getByTestId('link').elements();
    expect(links.length).toBe(2);
  });

  it('generates correct slug for each entry read more link', async () => {
    const FrontMatter = [
      createMockEntry({ filename: 'getting-started.md' }, 1),
      createMockEntry({ filename: 'advanced-guide.md' }, 2),
    ];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const links = page.getByTestId('link').elements();
    expect(links[0].getAttribute('href')).toContain('getting-started');
    expect(links[1].getAttribute('href')).toContain('advanced-guide');
  });

  it('renders read more button with book icon and chevron', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByTestId('book-icon')).toBeInTheDocument();
    await expect.element(page.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('renders buttons with outline variant', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).toHaveAttribute('data-variant', 'outline');
  });

  it('renders buttons with sm size', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const buttons = page.getByTestId('button').elements();
    expect(buttons[0]).toHaveAttribute('data-size', 'sm');
  });

  it('handles entry with no keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: '' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    // Should render without error, with no badges
    await expect.element(page.getByText('1. Entry 1')).toBeInTheDocument();
  });

  it('handles entry with only whitespace keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: '   ,   ,  ' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    // Should render without error
    await expect.element(page.getByText('1. Entry 1')).toBeInTheDocument();
  });

  it('renders empty list when FrontMatter array is empty', async () => {
    await render(<DocumentationListingPage FrontMatter={[]} KeywordArray={createMockKeywordArray()} />);
    // Should still render header and card
    await expect.element(page.getByTestId('card-title')).toHaveTextContent('Program Documentation');
    // Should not render any entry content
    expect(page.getByText(/^\d+\. Entry/i).elements().length).toBe(0);
  });

  it('renders links with full-width responsive classes', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const links = page.getByTestId('link').elements();
    expect(links[0]).toHaveClass('w-full');
  });

  it('renders entry with single keyword', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'testing' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(1);
    expect(badges[0]).toHaveTextContent('testing');
  });

  it('renders entry with many keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'testing,documentation,advanced,guide,tutorial,reference' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges.length).toBe(6);
  });

  it('renders keyword label before badge list', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText('Keywords:')).toBeInTheDocument();
  });

  it('renders tags label for keywords section', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const labels = page.getByText('Keywords:');
    expect(labels).toBeInTheDocument();
  });

  it('renders card content with divide-y styling', async () => {
    const FrontMatter = [createMockEntry({}, 1), createMockEntry({}, 2)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const content = page.getByTestId('card-content');
    expect(content).toHaveClass('divide-y');
  });

  it('correctly replaces .md extension in slug generation', async () => {
    const FrontMatter = [createMockEntry({ filename: 'docs.md' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const links = page.getByTestId('link').elements();
    const href = links[0].getAttribute('href');
    expect(href).not.toContain('.md');
    expect(href).toContain('docs');
  });

  it('renders read more text in button', async () => {
    const FrontMatter = [createMockEntry({}, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText('Read More')).toBeInTheDocument();
  });

  it('maintains entry order as provided', async () => {
    const FrontMatter = [
      createMockEntry({ title: 'First' }, 1),
      createMockEntry({ title: 'Second' }, 2),
      createMockEntry({ title: 'Third' }, 3),
    ];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    // Verify entries appear in order
    await expect.element(page.getByText('1. First')).toBeInTheDocument();
    await expect.element(page.getByText('2. Second')).toBeInTheDocument();
    await expect.element(page.getByText('3. Third')).toBeInTheDocument();
  });

  it('handles special characters in keywords', async () => {
    const FrontMatter = [createMockEntry({ keywords: 'c++,c#,gui' }, 1)];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    const badges = page.getByTestId('badge').elements();
    expect(badges[0]).toHaveTextContent('c++');
    expect(badges[1]).toHaveTextContent('c#');
    expect(badges[2]).toHaveTextContent('gui');
  });

  it('renders leading index with period in entry title display', async () => {
    const FrontMatter = [
      createMockEntry({ title: 'Getting Started' }, 1),
      createMockEntry({ title: 'Advanced Guide' }, 5),
    ];
    await render(<DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={createMockKeywordArray()} />);
    await expect.element(page.getByText(/^1\. Getting Started/)).toBeInTheDocument();
    await expect.element(page.getByText(/^5\. Advanced Guide/)).toBeInTheDocument();
  });
});
