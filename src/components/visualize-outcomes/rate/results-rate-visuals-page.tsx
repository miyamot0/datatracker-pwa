import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { SavedSessionResult } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SessionTerminationOptionsType } from '@/components/editor-session/forms/schema/session-designer-schema';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { KeyboardIcon, PointerIcon, ScatterChartIcon } from 'lucide-react';
import RateFigureVisualization from './rate-figure';
import { setLocalCachedPrefs } from '@/lib/local_storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { FIGURE_TEXT_OPTIONS, FigureVisualSizing } from '@/types/accessibility';
import { Link } from '@tanstack/react-router';
import { FilterByPrimaryRole } from '../helpers/filtering';

export default function ResultsRateVisualsPage({
  Group,
  Individual,
  Evaluation,
  ShowKeys,
  DynamicKeySet,
  Results,
  Schedule,
  ExcludeKeysFromCTB,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Results: SavedSessionResult[];
  DynamicKeySet: KeySet;
  Schedule: SessionTerminationOptionsType;
  ShowKeys: {
    KeyDescription: string;
    Visible: boolean;
  }[];
  ExcludeKeysFromCTB: {
    KeyDescription: string;
    Visible: boolean;
  }[];
}) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);
  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>(Schedule);
  const [figureTextSize, setFigureTextSize] = useState<FigureVisualSizing>('base');
  const [ctbSumKeys, setCTBSumKeys] = useState(ExcludeKeysFromCTB);

  const results_filtered = FilterByPrimaryRole(Results);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Target Rates`}
      className="select-none"
    >
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

        <CardContent className="flex flex-col gap-2">
          <div className="w-full flex flex-row justify-between mb-4">
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

                        const exclude_from_ctb = ctbSumKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        // TODO: Share this w/ summarizer
                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-fit">
                    <PointerIcon className="mr-2 w-4 h-4" />
                    Select Keys for CTB Calculation
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Toggle Inclusion</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ctbSumKeys.map((key, index) => (
                    <DropdownMenuCheckboxItem
                      key={`key-${index}`}
                      checked={key.Visible}
                      onCheckedChange={(checked: boolean) => {
                        const updatedKeys = ctbSumKeys.map((k) => {
                          if (k.KeyDescription === key.KeyDescription) {
                            return {
                              ...k,
                              Visible: checked,
                            };
                          }

                          return k;
                        });

                        const hidden_keys = filteredKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        const exclude_from_ctb = updatedKeys
                          .filter((k) => k.Visible === false)
                          .map((k) => k.KeyDescription);

                        setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                          KeyDescription: hidden_keys,
                          CTBElements: exclude_from_ctb,
                          Schedule: schedule,
                        });

                        setCTBSumKeys(updatedKeys);
                      }}
                    >
                      {key.KeyDescription}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-row gap-2">
              <div className="flex flex-row items-center gap-2 w-fit my-0 py-0">
                <p>Magnification:</p>
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

              <div className="flex flex-row items-center gap-2 w-fit">
                <p>Timer to Reference:</p>
                <Select
                  value={schedule}
                  onValueChange={(value: SessionTerminationOptionsType) => {
                    setSchedule(value);

                    const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                    const exclude_from_ctb = ctbSumKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                    setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
                      KeyDescription: hidden_keys,
                      CTBElements: exclude_from_ctb,
                      Schedule: value,
                    });
                  }}
                >
                  <SelectTrigger className="w-fit">
                    <SelectValue placeholder="Data Collector Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value={'End on Timer #1' as SessionTerminationOptionsType}>
                        Score on Timer #1 Time
                      </SelectItem>
                      <SelectItem value={'End on Timer #2' as SessionTerminationOptionsType}>
                        Score on Timer #2 Time
                      </SelectItem>
                      <SelectItem value={'End on Timer #3' as SessionTerminationOptionsType}>
                        Score on Timer #3 Time
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <p>
            This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
            be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
            which types of events to combine together (i.e., a combined target behavior [CTB] metric). Options set here
            will persist for future visits.
          </p>

          {DynamicKeySet && (
            <RateFigureVisualization
              FilteredSessions={results_filtered}
              ScheduleOption={schedule}
              CTBKeys={ctbSumKeys}
              KeySetFull={filteredKeys}
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              FigureTextSize={figureTextSize}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
