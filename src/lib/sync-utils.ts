import type { SyncFileType } from '@/types/sync';
import { isReservedFileName } from './reserved-names';

/**
 * Derives the file type from the parsed path segments.
 * Full path structure: /Group/Individual/Evaluation/Condition/file
 *
 * - keyset:             depth 3 — file directly in the individual folder (/G/I/file)
 * - session_parameters: depth 4, filename is 'settings.json' — inside an evaluation folder (/G/I/Eval/settings.json)
 * - figure_styles:     depth 4, filename is 'styles.json' — inside an evaluation folder (/G/I/Eval/styles.json)
 * - session_outcome:    depth 5 — nested inside an evaluation's condition folder (/G/I/Eval/Condition/file)
 */
export function classifySyncFileType(parts: string[]): SyncFileType {
  const filename = parts[parts.length - 1];
  if (parts.length === 3) return 'keyset';
  if (parts.length === 4 && filename === 'settings.json') return 'session_parameters';
  if (parts.length === 4 && isReservedFileName(filename)) return 'figure_styles';
  return 'session_outcome';
}
