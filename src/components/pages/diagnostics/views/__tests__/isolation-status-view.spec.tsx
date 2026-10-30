import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { IsolationStatusView } from '../isolation-status-view';
import { getDiagnosticsData, type DiagnosticsData } from '../../lib/helper';

describe('IsolationStatusView', () => {
  it('shows enabled badges when shared memory and isolation are supported', async () => {
    await render(
      <IsolationStatusView data={{ isSupported: true, isIsolated: true } as DiagnosticsData['isolation']} />,
    );

    await expect.element(page.getByText('Shared Array Buffer support:')).toBeInTheDocument();
    await expect.element(page.getByText('Cross-Origin Isolation:')).toBeInTheDocument();
    await expect.element(page.getByText('Enabled').first()).toBeInTheDocument();
    await expect.element(page.getByText('Disabled')).not.toBeInTheDocument();
  });

  it('shows disabled badges when neither feature is supported', async () => {
    await render(
      <IsolationStatusView data={{ isSupported: false, isIsolated: false } as DiagnosticsData['isolation']} />,
    );

    await expect.element(page.getByText('Disabled').first()).toBeInTheDocument();
    await expect.element(page.getByText('Enabled')).not.toBeInTheDocument();
  });

  it('reports each badge independently', async () => {
    await render(
      <IsolationStatusView data={{ isSupported: true, isIsolated: false } as DiagnosticsData['isolation']} />,
    );

    await expect.element(page.getByText('Enabled')).toBeInTheDocument();
    await expect.element(page.getByText('Disabled')).toBeInTheDocument();
  });
});

describe('getDiagnosticsData', () => {
  it('should return correctly mapped diagnostics data', () => {
    // Mocking dependencies for the test
    const mockSettings = { CacheBehavior: 'Standard' };
    const mockQueryClient = {
      getDefaultOptions: () => ({
        queries: { staleTime: 1000, gcTime: 5000 },
      }),
    };

    const data = getDiagnosticsData(mockSettings, mockQueryClient);

    expect(data).toHaveProperty('isolation');
    expect(data).toHaveProperty('issues');
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('cache');

    expect(typeof data.isolation.userAgent).toBe('string');
    expect(Array.isArray(data.issues.list)).toBe(true);
    expect(Array.isArray(data.recommendations.list)).toBe(true);
  });
});
