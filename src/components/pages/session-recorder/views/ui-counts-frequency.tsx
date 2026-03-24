import { cn } from '@/lib/utils';
import { KeySet } from '@/types/keyset';
import { ApplicationSettingsTypes } from '@/types/settings';
import { GenerateTableCols } from './ui-counts-cols';
import { generateChunkedVisuals } from '@/lib/displays';
import { KeyManageType } from '@/types/timing';

type Props = {
  Keyset: KeySet;
  KeysPressed: KeyManageType[];
  Settings: ApplicationSettingsTypes;
};

export default function SessionRecorderFrequencyTallies({ Keyset, KeysPressed, Settings }: Props) {
  const isDense = Settings.KeyDisplay === 'dense';
  const displaySize = Settings.DisplaySize;

  const { FrequencyKeyChunks, TablesF } = generateChunkedVisuals(
    Keyset,
    Keyset.FrequencyKeys,
    Keyset.DurationKeys,
    isDense,
    displaySize,
  );

  return (
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
  );
}
