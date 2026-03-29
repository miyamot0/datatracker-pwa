import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/components/elements/page-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="page-wrapper">{children}</div>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('@/components/ui/breadcrumb-entries', () => ({
  BuildGroupBreadcrumb: () => ({ label: 'Groups', href: '/' }),
  BuildIndividualsBreadcrumb: () => ({ label: 'Individuals', href: '/' }),
  BuildEvaluationsBreadcrumb: () => ({ label: 'Evaluations', href: '/' }),
}));

vi.mock('@/lib/strings', () => ({
  CleanUpString: (s: string) => s,
}));

// ----- Import under test -----

import ReliabilityBlank from '../reli-blank';

// ----- Tests -----

describe('ReliabilityBlank', () => {
  const defaultProps = { Group: 'GroupA', Individual: 'ClientB', Evaluation: 'Eval1' };

  it('renders inside a PageWrapper', () => {
    render(<ReliabilityBlank {...defaultProps} />);
    expect(screen.getByTestId('page-wrapper')).not.toBeNull();
  });

  it('renders the Reliability Viewer card title', () => {
    render(<ReliabilityBlank {...defaultProps} />);
    expect(screen.getByText('Reliability Viewer')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<ReliabilityBlank {...defaultProps} />);
    expect(screen.getByText('Error in Calculating Reliability')).not.toBeNull();
  });

  it('renders the no data message', () => {
    render(<ReliabilityBlank {...defaultProps} />);
    expect(screen.getByText('No data files are currently available to inspect.')).not.toBeNull();
  });

  it('renders the BackButton', () => {
    render(<ReliabilityBlank {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
  });
});
