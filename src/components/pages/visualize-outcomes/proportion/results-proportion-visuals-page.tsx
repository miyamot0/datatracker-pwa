import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { SavedSessionResult } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Edit3Icon, ScatterChartIcon } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { setLocalCachedPrefs } from '@/lib/local_storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { FIGURE_TEXT_OPTIONS, type FigureVisualSizing } from '@/types/accessibility';
import ProportionFigureVisualization from '@/components/pages/visualize-outcomes/proportion/proportion-figure';
import { Link } from '@tanstack/react-router';
import { Switch } from '@/components/ui/switch';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { ToggleDisplayKey } from '@/types/visuals';

export default function ResultsProportionVisualsPage({
  Group,
  Individual,
  Evaluation,
  DynamicKeySet,
  Schedule,
  ShowKeys,
  ResultsFiltered,
  MinX,
  MaxX,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Results: SavedSessionResult[];
  DynamicKeySet: KeySet;
  Schedule: SessionTerminationOptionsType;
  ShowKeys: ToggleDisplayKey[];
  ResultsFiltered: SavedSessionResult[];
  MinX: number;
  MaxX: number;
}) {
  const [filteredKeys, setFilteredKeys] = useState(ShowKeys);
  const [connectAllPoints, setConnectAllPoints] = useState(false);
  const [figureTextSize, setFigureTextSize] = useState<FigureVisualSizing>('base');
  const [schedule, setSchedule] = useState<SessionTerminationOptionsType>(Schedule);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Interval Proportions`}
      className="select-none"
    >
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Visualization of Behavioral Rates</CardTitle>
            <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link
              to={'/session/$group/$individual/$evaluation/rate'}
              params={{
                group: Group,
                individual: Individual,
                evaluation: Evaluation,
              }}
            >
              <Button variant={'outline'} className="shadow" size={'sm'}>
                <ScatterChartIcon className="mr-2 h-4 w-4" />
                See Rate
              </Button>
            </Link>
            <BackButton />
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="w-full flex flex-row justify-between">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-fit">
                  <Edit3Icon className="mr-2 w-4 h-4" />
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

                      setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                        KeyDescription: hidden_keys,
                        CTBElements: [],
                        Schedule: schedule,
                      });
                    }}
                  >
                    {key.KeyDescription}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Select Timer to Reference:</p>
              <Select
                value={schedule}
                onValueChange={(value: SessionTerminationOptionsType) => {
                  setSchedule(value);

                  const hidden_keys = filteredKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

                  setLocalCachedPrefs(Group, Individual, Evaluation, 'Duration', {
                    KeyDescription: hidden_keys,
                    CTBElements: [],
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
            This page provides a visual of the available data regarding <i>proportion of session time</i>. For
            convenience, series of data can be enabled or disabled for viewing. Options set here will persist for future
            visits.
          </p>

          {DynamicKeySet && (
            <ProportionFigureVisualization
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              FilteredSessions={ResultsFiltered}
              MinX={MinX}
              MaxX={MaxX}
              ScheduleOption={schedule}
              KeySetFull={filteredKeys}
              FigureTextSize={figureTextSize}
              ConnectSpans={connectAllPoints}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
