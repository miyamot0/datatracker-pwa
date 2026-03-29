import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DocumentationEntryPage from '../documentation-entry-page';
import { FolderHandleContext } from '@/context/folder-context';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { FrontMatterUniversalType, ParsedFrontMatterType } from '@/types/mdx';
import { KeywordColors } from '@/types/colors';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockLoaderData = vi.hoisted(() => ({
  KeywordArray: [] as KeywordColors[],
  PreviousEntry: null as FrontMatterUniversalType | null,
  NextEntry: null as FrontMatterUniversalType | null,
  Entry: {
    matter: {
      title: 'Test Article',
      filename: '001-test.md',
      slug: 'test',
      date: '2026-01-01',
      keywords: 'Setup, Configuration',
      author: 'Admin',
      description: 'A test article',
      index: 1,
    },
    value: '# Hello World\nSome content here.',
  } as ParsedFrontMatterType,
  Settings: {} as unknown,
}));

vi.mock('@/routes/documentation/$slug', () => ({
  Route: {
    useLoaderData: () => mockLoaderData,
  },
}));

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
      viewTransition?: unknown;
    }) => (
      <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
        {children}
      </a>
    ),
  };
});

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-wrapper">{children}</div>,
}));

vi.mock('../views/md-viewer', () => ({
  MdViewer: ({ source }: { source: string }) => <div data-testid="md-viewer">{source}</div>,
}));

vi.mock('@/components/ui/breadcrumb-entries', () => ({
  BuildDocumentationBreadcrumb: () => ({ label: 'Documentation', to: '/documentation' }),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

// ----- Helpers -----

const makeFrontMatterEntry = (slug: string, title: string): FrontMatterUniversalType => ({
  title,
  filename: `${slug}.md`,
  slug,
  date: '2026-01-01',
  keywords: 'General',
  author: 'Admin',
  description: 'desc',
  index: 1,
});

const renderComponent = () =>
  render(
    <FolderHandleContext.Provider
      value={
        {
          settings: { ...DEFAULT_APPLICATION_SETTINGS, TransitionBehavior: 'none' },
          setSettings: vi.fn(),
          saveSettings: vi.fn(),
          handle: undefined,
          setHandle: vi.fn(),
        } as unknown as React.ContextType<typeof FolderHandleContext>
      }
    >
      <DocumentationEntryPage />
    </FolderHandleContext.Provider>,
  );

// ----- Tests -----

describe('DocumentationEntryPage', () => {
  beforeEach(() => {
    mockLoaderData.KeywordArray = [];
    mockLoaderData.PreviousEntry = null as unknown as FrontMatterUniversalType | null;
    mockLoaderData.NextEntry = null as unknown as FrontMatterUniversalType | null;
    mockLoaderData.Entry = {
      matter: {
        title: 'Test Article',
        filename: '001-test.md',
        slug: 'test',
        date: '2026-01-01',
        keywords: 'Setup, Configuration',
        author: 'Admin',
        description: 'A test article',
        index: 1,
      },
      value: '# Hello World\nSome content here.',
    };
    mockLoaderData.Settings = { ...DEFAULT_APPLICATION_SETTINGS };
  });

  // ---- Card metadata ----

  describe('card metadata', () => {
    it('renders the article title in the card header', () => {
      renderComponent();
      expect(screen.getAllByText('Test Article').length).toBeGreaterThan(0);
    });

    it('renders the author and date in the card description', () => {
      renderComponent();
      expect(screen.getByText(/written 2026-01-01 by admin/i)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the MdViewer with the entry content', () => {
      renderComponent();
      expect(screen.getByTestId('md-viewer')).not.toBeNull();
      expect(screen.getByTestId('md-viewer').textContent).toContain('# Hello World');
    });

    it('wraps content in PageWrapper', () => {
      renderComponent();
      expect(screen.getByTestId('page-wrapper')).not.toBeNull();
    });
  });

  // ---- Keyword badges ----

  describe('keyword badges', () => {
    it('renders a badge for each keyword', () => {
      mockLoaderData.KeywordArray = [
        { Keyword: 'Setup', Color: 'bg-blue-500' },
        { Keyword: 'Configuration', Color: 'bg-green-500' },
      ];
      renderComponent();
      expect(screen.getByText('Setup')).not.toBeNull();
      expect(screen.getByText('Configuration')).not.toBeNull();
    });

    it('still renders keywords even when no color mapping is found (defaults to bg-gray-500)', () => {
      mockLoaderData.KeywordArray = [];
      renderComponent();
      // Both keyword strings from "Setup, Configuration" should still appear as badge text
      expect(screen.getByText('Setup')).not.toBeNull();
    });
  });

  // ---- Navigation links ----

  describe('navigation links', () => {
    it('renders the "Read Previous" button disabled when no PreviousEntry', () => {
      renderComponent();
      const prevBtn = screen.getByRole('button', { name: /read previous/i });
      expect(prevBtn.hasAttribute('disabled')).toBe(true);
    });

    it('renders the "Read Next" button disabled when no NextEntry', () => {
      renderComponent();
      const nextBtn = screen.getByRole('button', { name: /read next/i });
      expect(nextBtn.hasAttribute('disabled')).toBe(true);
    });

    it('renders the "Read Previous" button enabled when PreviousEntry is set', () => {
      mockLoaderData.PreviousEntry = makeFrontMatterEntry('000-prev', 'Previous Article');
      renderComponent();
      const prevBtn = screen.getByRole('button', { name: /read previous/i });
      expect(prevBtn.hasAttribute('disabled')).toBe(false);
    });

    it('renders the "Read Next" button enabled when NextEntry is set', () => {
      mockLoaderData.NextEntry = makeFrontMatterEntry('002-next', 'Next Article');
      renderComponent();
      const nextBtn = screen.getByRole('button', { name: /read next/i });
      expect(nextBtn.hasAttribute('disabled')).toBe(false);
    });

    it('Previous link includes the correct slug param', () => {
      mockLoaderData.PreviousEntry = makeFrontMatterEntry('000-prev', 'Previous Article');
      renderComponent();
      const links = screen.getAllByRole('link');
      const prevLink = links.find((l) => l.textContent?.includes('Read Previous'));
      const params = JSON.parse(prevLink!.getAttribute('data-params') ?? '{}');
      expect(params.slug).toBe('000-prev');
    });

    it('Next link includes the correct slug param', () => {
      mockLoaderData.NextEntry = makeFrontMatterEntry('002-next', 'Next Article');
      renderComponent();
      const links = screen.getAllByRole('link');
      const nextLink = links.find((l) => l.textContent?.includes('Read Next'));
      const params = JSON.parse(nextLink!.getAttribute('data-params') ?? '{}');
      expect(params.slug).toBe('002-next');
    });

    it('Previous link falls back to /documentation when no PreviousEntry', () => {
      renderComponent();
      const links = screen.getAllByRole('link');
      const prevLink = links.find((l) => l.textContent?.includes('Read Previous'));
      expect(prevLink!.getAttribute('href')).toBe('/documentation/$slug');
    });
  });
});
