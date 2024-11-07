import { QueryResponseStatus } from '@/hooks/types/query-status';
import { KeySet, KeySetExtended } from '@/types/keyset';

export type QueryResponseKeyboards = {
  status: QueryResponseStatus;
  data: KeySet[];
  error?: string;
};

export type QueryResponseKeyboardsExpanded = QueryResponseKeyboards & {
  handle?: FileSystemDirectoryHandle;
};

export type QueryResponseKeyboardsMeta = {
  status: QueryResponseStatus;
  data: KeySetExtended[];
  error?: string;
};

export type QueryResponseKeyboardsMetaExpanded = QueryResponseKeyboardsMeta & {
  handle?: FileSystemDirectoryHandle;
};

export type QueryResponseSingleKeyboard = {
  status: QueryResponseStatus;
  data?: KeySet;
  error?: string;
};

export type QueryResponseSingleKeyboardExpanded = QueryResponseSingleKeyboard & {
  handle?: FileSystemDirectoryHandle;
};
