import { QueryResponseStatus } from '@/hooks/types/query-status';
import { KeySet } from '@/types/keyset';

export type QueryResponseKeyboards = {
  status: QueryResponseStatus;
  data: KeySet[];
  error?: string;
};

export type QueryResponseKeyboardsExpanded = QueryResponseKeyboards & {
  handle?: FileSystemDirectoryHandle;
};
