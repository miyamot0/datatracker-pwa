import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { KeyManageType } from '../types/session-recorder-types';

type Props = {
  Keyset: KeySet;
  KeysPressed: KeyManageType[];
};

export default function SessionRecorderTallies({ Keyset, KeysPressed }: Props) {
  return (
    <div className="grid grid-cols-2 w-full gap-4 select-none">
      <div className="w-full border rounded shadow-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">Key (Frequency)</TableHead>
              <TableHead className="text-primary">Description</TableHead>
              <TableHead className="text-primary">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Keyset.FrequencyKeys.map((key, index) => (
              <TableRow key={index}>
                <TableHead className="text-primary">{key.KeyName}</TableHead>
                <TableHead className="text-primary">{key.KeyDescription}</TableHead>
                <TableHead className="text-primary">
                  {KeysPressed.filter((rec_key) => rec_key.KeyCode === key.KeyCode).length}
                </TableHead>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="w-full border rounded shadow-xl bg-card">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="text-primary">Key (Duration)</TableHead>
              <TableHead className="text-primary">Description</TableHead>
              <TableHead className="text-primary">Rounds</TableHead>
              <TableHead className="text-primary">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Keyset.DurationKeys.map((key, index) => {
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
                  <TableHead className="text-primary">{key.KeyName}</TableHead>
                  <TableHead className="text-primary">{key.KeyDescription}</TableHead>
                  <TableHead className="text-primary">{rounds}</TableHead>
                  <TableHead className="w-[150px] flex flex-row items-center text-primary">
                    <div
                      className={cn('transition-colors bg-transparent rounded-full px-2', {
                        'bg-green-500 text-white': is_odd,
                      })}
                    >
                      {duration.toFixed(2)}
                      {is_odd ? ` + ${active_duration.toFixed(2)}` : ''}
                    </div>
                  </TableHead>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
