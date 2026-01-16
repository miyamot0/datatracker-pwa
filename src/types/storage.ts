import { SavedSessionResult } from '@/lib/dtos';

export type ModifiedSessionResult = SavedSessionResult & {
  Filename: string;
};
