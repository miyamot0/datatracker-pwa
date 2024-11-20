import { QueryResponseStatus } from '@/hooks/types/query-status';

export type QueryResponseClients = {
  status: QueryResponseStatus;
  data: string[];
  error?: string;
};

export type QueryResponseClientsExpanded = QueryResponseClients & {
  handle?: FileSystemDirectoryHandle;
};
