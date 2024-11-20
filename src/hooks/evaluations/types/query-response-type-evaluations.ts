import { QueryResponseStatus } from '@/hooks/types/query-status';

export type QueryResponseEvaluations = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

export type QueryResponseEvaluationsExpanded = QueryResponseEvaluations & {
  handle?: FileSystemDirectoryHandle;
};

export type EvaluationRecord = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
};

export type QueryResponseEvaluationsMeta = {
  status: QueryResponseStatus;
  data: EvaluationRecord[];
  error?: string;
};

export type QueryResponseEvaluationsMetaExpanded = QueryResponseEvaluationsMeta & {
  handle?: FileSystemDirectoryHandle;
};
