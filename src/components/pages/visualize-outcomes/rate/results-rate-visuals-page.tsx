import { SavedSessionResult } from '@/lib/dtos/session-results';
import { KeySet } from '@/types/keyset';
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyboardIcon, LineChartIcon, ScatterChartIcon } from 'lucide-react';
import RateFigureVisualization from './rate-figure';
import { setLocalCachedPrefs } from '@/lib/local_storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { FIGURE_TEXT_OPTIONS, type FigureVisualSizing } from '@/types/accessibility';
import { Link } from '@tanstack/react-router';
import { Switch } from '@/components/ui/switch';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { ToggleDisplayCondition, ToggleDisplayKey } from '@/types/visuals';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import {
  filteredSessionScoringOptions,
  ScheduleMappingOptions,
  ScheduleMappingOptionsType,
  ScoringOptionsMapType,
} from '@/types/schedules';

export default function ResultsRateVisualsPage({
  Group,
  Individual,
  Evaluation,
  Conditions,
  ShowKeys,
  DynamicKeySet,
  ResultsFiltered,
  TimerMapping,
  MinX,
  MaxX,
  Settings,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
  Handle: FileSystemHandle;
  Results: SavedSessionResult[];
  ResultsFiltered: SavedSessionResult[];
  DynamicKeySet: KeySet;
  TimerMapping: ScoringOptionsMapType;
  ShowKeys: ToggleDisplayKey[];
  MinX: number;
  MaxX: number;
  Settings: ApplicationSettingsTypes;
}) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys.sort((a, b) => b.KeyType.localeCompare(a.KeyType)));
  const [filteredConditions, setFilteredConditions] = useState<ToggleDisplayCondition[]>(
    Conditions.map((condition) => ({ Condition: condition, Visible: true })),
  );

  const [connectAllPoints, setConnectAllPoints] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleMappingOptionsType | { value: string; label: string }>(TimerMapping);
  const [figureTextSize, setFigureTextSize] = useState<FigureVisualSizing>('base');

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>Visualization of Behavioral Rates</CardTitle>
          <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
        </div>

        <div className="flex flex-row gap-2">
          <Link
            to={'/session/$group/$individual/$evaluation/proportion'}
            params={{
              group: Group,
              individual: Individual,
              evaluation: Evaluation,
            }}
          >
            <Button variant={'outline'} className="shadow" size={'sm'}>
              <ScatterChartIcon className="mr-2 h-4 w-4" />
              See Proportion
            </Button>
          </Link>

          <BackButton />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <div className="flex flex-row gap-2">
            <div className="flex flex-row gap-4">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <KeyboardIcon className="mr-2 w-4 h-4" />
                    Edit Keys Displayed
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filteredKeys.map((key, index) => (
                    <DropdownMenuCheckboxItem
                      className="flex flex-row justify-between"
                      key={`key-${index}`}
                      checked={key.Visible}
                      onCheckedChange={(checked) => {
                        const updatedKeys = filteredKeys.map((k) => {
                          if (k.KeyDescription === key.KeyDescription) {
                            return {
                              ...k,
                              Visible: checked,
                            };
                          }

                          return k;
                        });

                        setFilteredKeys(updatedKeys);

                        const hidden_keys = updatedKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          Schedule: schedule.value,
                        });
                      }}
                    >
                      <p>{key.KeyDescription}</p>
                      {key.KeyType === 'Derived' && <p className="text-xs text-muted-foreground">({key.KeyType})</p>}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-row gap-4">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <LineChartIcon className="mr-2 w-4 h-4" />
                    Edit Conditions Displayed
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filteredConditions.map((condition, index) => (
                    <DropdownMenuCheckboxItem
                      className="flex flex-row justify-between"
                      key={`condition-${index}`}
                      checked={condition.Visible}
                      onCheckedChange={(checked) => {
                        const updatedConditions = filteredConditions.map((c) => {
                          if (c.Condition === condition.Condition) {
                            return {
                              ...c,
                              Visible: checked,
                            };
                          }

                          return c;
                        });

                        setFilteredConditions(updatedConditions);
                      }}
                    >
                      <p>{condition.Condition}</p>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Timer to Reference:</p>
              <Select
                value={schedule.value}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  const selectedOptionFixed = ScheduleMappingOptions.find((option) => option.value === value);

                  if (selectedOptionFixed) {
                    // Note: A pre-made but filter option
                    setSchedule(selectedOptionFixed);
                  }

                  const specialKeyOption = filteredSessionScoringOptions(Settings, DynamicKeySet, false, true).find(
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
                  <SelectValue placeholder="Timer to Reference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredSessionScoringOptions(Settings, DynamicKeySet, true, true).map((option) => (
                      <SelectItem key={option.value} value={option.value as SessionTerminationOptionsType}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2 justify-between">
          <div className="flex flex-row items-center gap-2 w-fit my-0 py-0">
            <p className="whitespace-nowrap">Element Magnification:</p>
            <Select
              value={figureTextSize}
              onValueChange={(value: FigureVisualSizing) => {
                setFigureTextSize(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Text Size" className="" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FIGURE_TEXT_OPTIONS.map((opt) => (
                    <SelectItem value={opt.value} key={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 w-fit my-0 py-0">
            <p className="whitespace-nowrap">Connect All Spans:</p>
            <Switch checked={connectAllPoints} onCheckedChange={(checked) => setConnectAllPoints(checked)} />
          </div>
        </div>

        <p>
          This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
          be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
          which types of events to combine together using the optional logic builder. Options set here will persist for
          future visits.
        </p>

        {DynamicKeySet && (
          <RateFigureVisualization
            FilteredSessions={ResultsFiltered.filter((result) => {
              const conditionMatch = filteredConditions.find((c) => c.Condition === result.SessionSettings.Condition);
              return conditionMatch ? conditionMatch.Visible : true;
            })}
            ScheduleOption={schedule.value}
            KeySetFull={filteredKeys}
            DynamicKeySet={DynamicKeySet}
            Group={Group}
            Individual={Individual}
            Evaluation={Evaluation}
            FigureTextSize={figureTextSize}
            ConnectSpans={connectAllPoints}
            MinX={MinX}
            MaxX={MaxX}
          />
        )}
      </CardContent>
    </Card>
  );
}
