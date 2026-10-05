import { getDiagnosticsData } from '../../lib/helper';

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
