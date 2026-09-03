import { checkCrossOriginIsolation } from '@/lib/shared-buffer';

export interface DiagnosticsData {
  isolation: {
    isSupported: boolean;
    isIsolated: boolean;
    userAgent: string;
  };
  issues: {
    count: number;
    list: string[];
  };
  recommendations: {
    count: number;
    list: string[];
  };
  cache: {
    mode: string;
    staleTime: string;
    gcTime: string;
  };
}

export function getDiagnosticsData(settings: { CacheBehavior: string }, queryClient: any): DiagnosticsData {
  const check = checkCrossOriginIsolation();

  return {
    isolation: {
      isSupported: check.isSupported,
      isIsolated: check.isIsolated,
      userAgent: check.userAgent,
    },
    issues: {
      count: check.issues.length,
      list: check.issues,
    },
    recommendations: {
      count: check.recommendations.length,
      list: check.recommendations,
    },
    cache: {
      mode: settings.CacheBehavior,
      staleTime: queryClient.getDefaultOptions().queries?.staleTime?.toString() ?? '',
      gcTime: queryClient.getDefaultOptions().queries?.gcTime?.toString() ?? '',
    },
  };
}
