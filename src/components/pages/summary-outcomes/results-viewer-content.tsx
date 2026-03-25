import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewDurationResults from './views/view-duration-results';
import ViewFrequencyResults from './views/view-frequency-results';
import { useState } from 'react';
import { ModifiedSessionResult } from '@/types/storage';
import { KeySet } from '@/types/keyset';
import {
  filteredSessionScoringOptions,
  ScheduleMappingOptions,
  ScheduleMappingOptionsType,
  ScoringOptionsMapType,
} from '@/types/schedules';
import { DataCollectorRolesType } from '@/types/roles';
import { ToggleDisplayKey } from '@/types/visuals';
import { ApplicationSettingsTypes } from '@/types/settings';

type Props = {
  TimerMapping: ScoringOptionsMapType;
  Results: ModifiedSessionResult[];
  Keyset: KeySet;
  Group: string;
  Individual: string;
  Evaluation: string;
  ShowKeysFreq: ToggleDisplayKey[];
  ShowKeysDuration: ToggleDisplayKey[];
  Settings: ApplicationSettingsTypes;
};

export default function ResultsViewerContent({
  TimerMapping,
  Results,
  Keyset,
  Group,
  Individual,
  Evaluation,
  ShowKeysFreq,
  ShowKeysDuration,
  Settings,
}: Props) {
  const [role, setRole] = useState<DataCollectorRolesType>('Primary');
  const [schedule, setSchedule] = useState<ScheduleMappingOptionsType | { value: string; label: string }>(TimerMapping);

  const filteredResults = Results.sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session).filter(
    (result) => result.SessionSettings.Role === role,
  );

  // TODO: Potentially support later, but problematic for now
  const showDuration = ScheduleMappingOptions.find((option) => option.value === schedule.value) ? true : false;

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
              const selectedOptionFixed = ScheduleMappingOptions.find((option) => option.value === value);

              if (selectedOptionFixed) {
                // Note: A pre-made but filter option
                setSchedule(selectedOptionFixed);
              }

              const specialKeyOption = filteredSessionScoringOptions(Settings, Keyset, false, true).find(
                (option) => option.value === value,
              );

              if (specialKeyOption) {
                // Note: A special key option
                setSchedule({
                  value: specialKeyOption.value,
                  label: specialKeyOption.label,
                });
              }
            }}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Timer Scoring" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {filteredSessionScoringOptions(Settings, Keyset, true, true).map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
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
          LatestKeyset={Keyset}
          ShowKeysFreq={ShowKeysFreq}
          Group={Group}
          Individual={Individual}
          Evaluation={Evaluation}
        />
      )}

      {false && showDuration && Keyset.DurationKeys.length > 0 && (
        <ViewDurationResults
          SessionTimer={schedule.value}
          Results={filteredResults}
          LatestKeyset={Keyset}
          ShowKeysDuration={ShowKeysDuration}
          Group={Group}
          Individual={Individual}
          Evaluation={Evaluation}
        />
      )}
    </div>
  );
}
