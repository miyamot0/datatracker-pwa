import { QueryResponseStatus } from '@/hooks/types/query-status';

export type QueryResponseGroups = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

export type QueryResponseGroupsExpanded = QueryResponseGroups & {
  handle?: FileSystemDirectoryHandle;
};
