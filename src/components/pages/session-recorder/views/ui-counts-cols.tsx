import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReactNode } from 'react';
import { KeySetInstance } from '@/types/keyset';
import { cn } from '@/lib/utils';
import { KeyManageType } from '@/types/timing';

type Props = {
  Keys: KeySetInstance[];
  KeysPressed: KeyManageType[];
  NumCols: number;
  KeyType: 'Frequency' | 'Duration';
  IsSecondary?: boolean;
  IsSkinny?: boolean;
};

export function GenerateTableCols({
  Keys,
  KeysPressed,
  NumCols,
  KeyType,
  IsSecondary = false,
  IsSkinny = false,
}: Props): ReactNode {
  const isNarrow = NumCols > 1;
  const KeyLabel = KeyType === 'Duration' ? (isNarrow ? '(D)' : '(Duration)') : isNarrow ? '(F)' : '(Frequency)';

  console.log('KeyType:', KeyType, 'Is Skinny:', IsSkinny, 'NumCols:', NumCols);

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
        {KeyType == 'Frequency' &&
          Keys.map((key, index) => (
            <TableRow key={index}>
              <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>{key.KeyName}</TableCell>
              <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>{key.KeyDescription}</TableCell>
              <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>
                {KeysPressed.filter((rec_key) => rec_key.KeyCode === key.KeyCode).length}
              </TableCell>
            </TableRow>
          ))}

        {KeyType == 'Duration' &&
          Keys.map((key, index) => {
            const matching_keys = KeysPressed.filter((rec_key) => rec_key.KeyCode === key.KeyCode);
            const rounds = Math.floor(matching_keys.length / 2);

            let active_duration = 0;

            const is_odd = matching_keys.length % 2 === 1;

            if (is_odd) {
              const current_time = new Date();
              const last_key = matching_keys.slice(-1)[0].TimePressed;

              active_duration = (current_time.getTime() - last_key.getTime()) / 1000;
            }

            let duration = 0;

            const offset = is_odd ? -1 : 0;

            for (let i = 0; i < matching_keys.length + offset; i += 2) {
              const start = matching_keys[i].TimePressed;
              const end = matching_keys[i + 1].TimePressed;

              duration += (end.getTime() - start.getTime()) / 1000;
            }

            return (
              <TableRow key={index}>
                <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>{key.KeyName}</TableCell>
                <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>{key.KeyDescription}</TableCell>
                <TableCell className={cn('text-primary', { 'py-2': IsSkinny })}>{rounds}</TableCell>
                <TableCell className={cn('w-[150px] flex flex-row items-center text-primary', { 'py-2': IsSkinny })}>
                  <div
                    className={cn('transition-colors bg-transparent rounded-full px-2', {
                      'bg-green-500 text-white': is_odd,
                    })}
                  >
                    {duration.toFixed(2)}
                    {is_odd ? ` + ${active_duration.toFixed(2)}` : ''}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}
