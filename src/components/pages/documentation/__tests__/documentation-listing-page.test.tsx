import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DocumentationListingPage from '../documentation-listing-page';
import { FrontMatterUniversalType } from '@/types/mdx';
import { KeywordColors } from '@/types/colors';

// ----- Module mocks -----

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      className,
    }: {
      to: string;
      params?: Record<string, string>;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
        {children}
      </a>
    ),
  };
});

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

// ----- Helpers -----

const makeFrontMatter = (overrides: Partial<FrontMatterUniversalType> = {}): FrontMatterUniversalType => ({
  title: 'Getting Started',
  filename: '001-getting-started.md',
  slug: 'getting-started',
  date: '2026-01-01',
  keywords: 'Setup, Basics',
  author: 'Admin',
  description: 'How to get started',
  index: 1,
  ...overrides,
});

const sampleKeywords: KeywordColors[] = [
  { Keyword: 'Setup', Color: 'bg-blue-500' },
  { Keyword: 'Basics', Color: 'bg-green-500' },
];

// ----- Tests -----

describe('DocumentationListingPage', () => {
  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      render(<DocumentationListingPage FrontMatter={[]} KeywordArray={[]} />);
      expect(screen.getByText('Program Documentation')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<DocumentationListingPage FrontMatter={[]} KeywordArray={[]} />);
      expect(screen.getByText('Guidelines and Instructions for using DataTracker')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<DocumentationListingPage FrontMatter={[]} KeywordArray={[]} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders nothing in the content area when FrontMatter is empty', () => {
      render(<DocumentationListingPage FrontMatter={[]} KeywordArray={[]} />);
      expect(screen.queryByRole('link')).toBeNull();
    });
  });

  // ---- Entry rendering ----

  describe('entry rendering', () => {
    const entries: FrontMatterUniversalType[] = [
      makeFrontMatter({ index: 1, title: 'Getting Started', filename: '001-getting-started.md' }),
      makeFrontMatter({ index: 2, title: 'Advanced Topics', filename: '002-advanced.md', keywords: 'Advanced' }),
    ];

    it('renders one entry per FrontMatter item', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      expect(screen.getByText(/1\. Getting Started/)).not.toBeNull();
      expect(screen.getByText(/2\. Advanced Topics/)).not.toBeNull();
    });

    it('renders the description for each entry', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      expect(screen.getAllByText('How to get started').length).toBeGreaterThan(0);
    });

    it('renders author and date for each entry', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      expect(screen.getAllByText(/written 2026-01-01 by admin/i).length).toBeGreaterThan(0);
    });

    it('renders a "Read More" button for each entry', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      expect(screen.getAllByRole('button', { name: /read more/i })).toHaveLength(2);
    });

    it('each "Read More" link points to the documentation slug route', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      const links = screen.getAllByRole('link');
      expect(links[0].getAttribute('href')).toBe('/documentation/$slug');
    });

    it('first entry link has slug derived from filename without .md', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      const links = screen.getAllByRole('link');
      const params = JSON.parse(links[0].getAttribute('data-params') ?? '{}');
      expect(params.slug).toBe('001-getting-started');
    });

    it('second entry link has correct slug', () => {
      render(<DocumentationListingPage FrontMatter={entries} KeywordArray={sampleKeywords} />);
      const links = screen.getAllByRole('link');
      const params = JSON.parse(links[1].getAttribute('data-params') ?? '{}');
      expect(params.slug).toBe('002-advanced');
    });
  });

  // ---- Keyword badges ----

  describe('keyword badges', () => {
    it('renders color-matched badges for known keywords', () => {
      const entry = makeFrontMatter({ keywords: 'Setup, Basics' });
      render(<DocumentationListingPage FrontMatter={[entry]} KeywordArray={sampleKeywords} />);
      expect(screen.getByText('Setup')).not.toBeNull();
      expect(screen.getByText('Basics')).not.toBeNull();
    });

    it('still renders a badge for an unknown keyword (default gray color)', () => {
      const entry = makeFrontMatter({ keywords: 'UnknownTopic' });
      render(<DocumentationListingPage FrontMatter={[entry]} KeywordArray={[]} />);
      expect(screen.getByText('UnknownTopic')).not.toBeNull();
    });

    it('ignores empty keyword strings after splitting', () => {
      const entry = makeFrontMatter({ keywords: 'Setup,  , Basics' });
      render(<DocumentationListingPage FrontMatter={[entry]} KeywordArray={sampleKeywords} />);
      // Only non-empty keywords should appear as badges
      const badges = screen.getAllByText(/Setup|Basics/);
      expect(badges.length).toBe(2);
    });
  });
});
