import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewDurationResults from './view-duration-results';
import ViewFrequencyResults from './view-frequency-results';
import { DataCollectorRolesType } from '@/routes/session/$group/$individual/$evaluation/-components/session-designer/forms/schema/session-designer-schema';
import { useState } from 'react';
import { ModifiedSessionResult } from '@/types/storage';
import { EnhancedKeySetInstance, KeySet } from '@/types/keyset';
import { ScheduleMappingOptions, ScheduleMappingOptionsType } from '@/types/schedules';

type Props = {
  UnfilteredKeysFrequency: EnhancedKeySetInstance[];
  UnfilteredKeysDuration: EnhancedKeySetInstance[];
  TimerMapping: ScheduleMappingOptionsType;
  ExcludeFromCTB: EnhancedKeySetInstance[];
  Results: ModifiedSessionResult[];
  Keyset: KeySet;
  Group: string;
  Individual: string;
  Evaluation: string;
};

export default function ResultsViewerContent({
  UnfilteredKeysFrequency,
  UnfilteredKeysDuration,
  TimerMapping,
  ExcludeFromCTB,
  Results,
  Keyset,
  Group,
  Individual,
  Evaluation,
}: Props) {
  const [role, setRole] = useState<DataCollectorRolesType>('Primary');
  const [schedule, setSchedule] = useState<ScheduleMappingOptionsType>(TimerMapping);

  const filteredResults = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === role,
  );

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <p>Filter by Data Collector:</p>
          <Select
            value={role}
            onValueChange={(value: DataCollectorRolesType) => {
              setRole(value);
            }}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Data Collector Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="Primary">Primary Data Collector</SelectItem>
                <SelectItem value="Reliability">Reliability Data Collector</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-row items-center gap-2">
          <p>Score By Schedule:</p>
          <Select
            value={schedule.value}
            onValueChange={(value: ScheduleMappingOptionsType['value']) => {
              const selectedOption = ScheduleMappingOptions.find((option) => option.value === value);
              if (selectedOption) {
                setSchedule(selectedOption);
              }
            }}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Timer Scoring" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ScheduleMappingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {Keyset.FrequencyKeys.length > 0 && (
        <ViewFrequencyResults
          SessionTimer={schedule.value}
          Results={filteredResults}
          ExcludeFromCTB={ExcludeFromCTB}
          UnfilteredKeyList={UnfilteredKeysFrequency}
        />
      )}

      {Keyset.DurationKeys.length > 0 && (
        <ViewDurationResults
          SessionTimer={schedule.value}
          Results={filteredResults}
          UnfilteredKeyList={UnfilteredKeysDuration}
          Group={Group}
          Individual={Individual}
          Evaluation={Evaluation}
        />
      )}
    </div>
  );
}
