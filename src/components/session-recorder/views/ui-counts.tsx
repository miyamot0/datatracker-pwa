import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { KeyManageType } from '../types/session-recorder-types';
import { ApplicationSettingsTypes } from '@/types/settings';
import { GenerateTableCols } from './ui-counts-cols';
import { generateChunkedVisuals } from '../helpers/key-display-columns';

type Props = {
  Keyset: KeySet;
  KeysPressed: KeyManageType[];
  Settings: ApplicationSettingsTypes;
};

export default function SessionRecorderTallies({ Keyset, KeysPressed, Settings }: Props) {
  const isDense = Settings.KeyDisplay === 'dense';
  const displaySize = Settings.DisplaySize;

  const { FrequencyKeyChunks, DurationKeyChunks, TablesF, TablesD } = generateChunkedVisuals(
    Keyset,
    Keyset.FrequencyKeys,
    Keyset.DurationKeys,
    isDense,
    displaySize,
  );

  return (
    <div className="grid grid-cols-2 w-full gap-4 select-none">
      <div
        className={cn('w-full border rounded shadow-xl bg-card grid grid-cols-1 divide-x', {
          'lg:grid-cols-2': TablesF == 2,
          'xl:grid-cols-3': TablesF == 3,
        })}
      >
        {FrequencyKeyChunks.map((chunk, index) => (
          <GenerateTableCols
            key={index}
            Keys={chunk}
            KeysPressed={KeysPressed}
            NumCols={TablesF}
            KeyType="Frequency"
            IsSecondary={index > 0}
          />
        ))}
      </div>
      <div
        className={cn('w-full border rounded shadow-xl bg-card grid grid-cols-1 divide-x', {
          'lg:grid-cols-2': TablesD == 2,
          'xl:grid-cols-3': TablesD == 3,
        })}
      >
        {DurationKeyChunks.map((chunk, index) => (
          <GenerateTableCols
            key={index}
            Keys={chunk}
            KeysPressed={KeysPressed}
            NumCols={TablesD}
            KeyType="Duration"
            IsSecondary={index > 0}
          />
        ))}
      </div>
    </div>
  );
}
