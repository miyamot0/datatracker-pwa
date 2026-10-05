import { getDiagnosticsData } from '../helper';

describe('getDiagnosticsData', () => {
  it('should return correctly mapped diagnostics data', () => {
    // Note: In a real environment, we would mock Route.useLoaderData and checkCrossOriginIsolation
    const data = getDiagnosticsData(
      { CacheBehavior: 'Standard' },
      { getDefaultOptions: () => ({ queries: { staleTime: 1000, gcTime: 5000 } }) },
    );

    expect(data).toHaveProperty('isolation');
    expect(data).toHaveProperty('issues');
    expect(data).toHaveProperty('recommendations');
    expect(data).toHaveProperty('cache');

    expect(typeof data.isolation.userAgent).toBe('string');
    expect(Array.isArray(data.issues.list)).toBe(true);
    expect(Array.isArray(data.recommendations.list)).toBe(true);
  });
});
