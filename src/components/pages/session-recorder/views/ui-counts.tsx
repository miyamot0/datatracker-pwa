import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { KeyManageType } from '../types/session-recorder-types';
import { ApplicationSettingsTypes } from '@/types/settings';

type Props = {
  Keyset: KeySet;
  KeysPressed: KeyManageType[];
  Settings: ApplicationSettingsTypes;
};

const generateTableCols = (
  Keys: KeySetInstance[],
  KeysPressed: KeyManageType[],
  NumCols: number,
  KeyType: 'Frequency' | 'Duration',
  IsSecondary: boolean = false,
) => {
  const isNarrow = NumCols > 1;
  const KeyLabel = KeyType === 'Duration' ? (isNarrow ? '(D)' : '(Duration)') : isNarrow ? '(F)' : '(Frequency)';

  return (
    <Table
      className={cn('', {
        '': IsSecondary,
      })}
    >
      <TableHeader>
        <TableRow>
          <TableHead className="text-primary">Key {KeyLabel}</TableHead>
          <TableHead className="text-primary">Description</TableHead>
          <TableHead className="text-primary">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Keys.map((key, index) => (
          <TableRow key={index}>
            <TableCell className="text-primary">{key.KeyName}</TableCell>
            <TableCell className="text-primary">{key.KeyDescription}</TableCell>
            <TableCell className="text-primary">
              {KeysPressed.filter((rec_key) => rec_key.KeyCode === key.KeyCode).length}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const MIN_KEY_COUNT_FOR_SPLIT = 3;

export default function SessionRecorderTallies({ Keyset, KeysPressed, Settings }: Props) {
  const isDense = Settings.KeyDisplay === 'dense';

  const frequency_keys = Keyset.FrequencyKeys.length;
  const freqTablesToShow = isDense && frequency_keys > MIN_KEY_COUNT_FOR_SPLIT ? 2 : 1;
  const freqHalf = Math.ceil(frequency_keys / freqTablesToShow);

  const duration_keys = Keyset.DurationKeys.length;
  const durTablesToShow = isDense && duration_keys > MIN_KEY_COUNT_FOR_SPLIT ? 2 : 1;
  const durHalf = Math.ceil(duration_keys / durTablesToShow);

  return (
    <div className="grid grid-cols-2 w-full gap-4 select-none">
      <div
        className={cn('w-full border rounded shadow-xl bg-card grid grid-cols-1 divide-x', {
          'lg:grid-cols-2 ': freqTablesToShow == 2,
        })}
      >
        {freqTablesToShow === 1 ? (
          generateTableCols(Keyset.FrequencyKeys, KeysPressed, freqTablesToShow, 'Frequency')
        ) : (
          <>
            {generateTableCols(Keyset.FrequencyKeys.slice(0, freqHalf), KeysPressed, freqTablesToShow, 'Frequency')}
            {generateTableCols(Keyset.FrequencyKeys.slice(freqHalf), KeysPressed, freqTablesToShow, 'Frequency', true)}
          </>
        )}
      </div>
      <div
        className={cn('w-full border rounded shadow-xl bg-card grid grid-cols-1 divide-x', {
          'grid-cols-2': durTablesToShow == 2,
        })}
      >
        {durTablesToShow === 1 ? (
          generateTableCols(Keyset.DurationKeys, KeysPressed, durTablesToShow, 'Duration')
        ) : (
          <>
            {generateTableCols(Keyset.DurationKeys.slice(0, durHalf), KeysPressed, durTablesToShow, 'Duration')}
            {generateTableCols(Keyset.DurationKeys.slice(durHalf), KeysPressed, durTablesToShow, 'Duration', true)}
          </>
        )}
      </div>
    </div>
  );
}
