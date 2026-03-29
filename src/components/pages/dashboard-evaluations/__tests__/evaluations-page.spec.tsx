import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect } from 'vitest';
import EvaluationsPage from '../evaluations-page';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import '@/styles/globals.css';

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
  })),
}));

vi.mock('@tanstack/react-router', () => ({
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
    <a
      href={to}
      data-params={params ? JSON.stringify(params) : undefined}
      className={className}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </a>
  ),
  useRouter: () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
}));

vi.mock('@/queries/evaluations/mutate-evaluations', () => ({
  mutationEvaluations: vi.fn(),
}));

// ----- Tests -----

describe('EvaluationsPage', ({ meta }) => {
  it('renders with full styles and saves a screenshot', async () => {
    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <TooltipProvider>
          <EvaluationsPage
            Group="GroupA"
            Individual="ClientB"
            Evaluations={['Functional Analysis', 'Demand Treatment Evaluation', 'Attention Treatment Evaluation']}
            Settings={{ ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true }}
            Handle={{ name: 'root' } as FileSystemDirectoryHandle}
          />
        </TooltipProvider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../../public/screenshots2/evaluation_page.png' });
  });
});
