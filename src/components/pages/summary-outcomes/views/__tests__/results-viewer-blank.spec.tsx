import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

import ResultsViewerBlank from '../results-viewer-blank';

describe('ResultsViewerBlank', () => {
  it('renders the Results Viewer card title and no data description', async () => {
    render(<ResultsViewerBlank />);

    await expect.element(page.getByText('Results Viewer')).toBeInTheDocument();
    await expect.element(page.getByText('No Data Yet')).toBeInTheDocument();
  });

  it('renders the no session data message', async () => {
    render(<ResultsViewerBlank />);

    await expect.element(page.getByText('No session data is currently available to view.')).toBeInTheDocument();
  });
});
