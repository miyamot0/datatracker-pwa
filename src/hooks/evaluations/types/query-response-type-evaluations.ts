import { QueryResponseStatus } from '@/hooks/types/query-status';

export type QueryResponseEvaluations = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

export type QueryResponseEvaluationsExpanded = QueryResponseEvaluations & {
  handle?: FileSystemDirectoryHandle;
};
