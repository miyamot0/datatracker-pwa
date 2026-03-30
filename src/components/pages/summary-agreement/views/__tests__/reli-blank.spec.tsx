// @ts-nocheck
import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect } from 'vitest';

vi.stubGlobal('BUILD_VERSION', 'test-build');
vi.stubGlobal('BUILD_DATE', '03/29/2026');

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { go: vi.fn() } }),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }) => <a>{children}</a>,
}));

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: vi.fn(),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('@/lib/strings', () => ({
  CleanUpString: (s: string) => s,
}));

// ----- Import under test -----

import ReliabilityBlank from '../reli-blank';
import { FolderContextProvider } from '@/context/folder-context';

// ----- Tests -----

describe('ReliabilityBlank', () => {
  const defaultProps = { Group: 'GroupA', Individual: 'ClientB', Evaluation: 'Eval1' };

  it('renders inside a PageWrapper', async () => {
    await render(
      <FolderContextProvider>
        <ReliabilityBlank {...defaultProps} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByRole('main')).toBeInTheDocument();
  });

  it('renders the Reliability Viewer card title', async () => {
    await render(
      <FolderContextProvider>
        <ReliabilityBlank {...defaultProps} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByText('Reliability Viewer')).toBeInTheDocument();
  });

  it('renders the card description', async () => {
    await render(
      <FolderContextProvider>
        <ReliabilityBlank {...defaultProps} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByText('Error in Calculating Reliability')).toBeInTheDocument();
  });

  it('renders the no data message', async () => {
    await render(
      <FolderContextProvider>
        <ReliabilityBlank {...defaultProps} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByText('No data files are currently available to inspect.')).toBeInTheDocument();
  });

  it('renders reliability viewer body content', async () => {
    await render(
      <FolderContextProvider>
        <ReliabilityBlank {...defaultProps} />
      </FolderContextProvider>,
    );
    await expect.element(page.getByText('No data files are currently available to inspect.')).toBeInTheDocument();
  });
});
