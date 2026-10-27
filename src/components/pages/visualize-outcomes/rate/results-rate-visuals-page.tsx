import { SavedSessionResult } from '@/lib/dtos/session-results';
import { KeySet } from '@/types/keyset';
import { useRef, useState } from 'react';
import { saveChartImage } from '@/components/pages/visualize-outcomes/shared/chart-export';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScatterChartIcon } from 'lucide-react';
import RateFigureVisualization from './rate-figure';
import {
  getLocalConnectSpans,
  getLocalFigureLabels,
  getLocalSeriesStyles,
  getLocalShowTitle,
  getLocalShowTooltip,
  getLocalShowConditionLegend,
  getLocalShowDescription,
  setLocalShowTooltip,
  setLocalShowConditionLegend,
  setLocalShowDescription,
  setLocalCachedPrefs,
  setLocalConnectSpans,
  setLocalFigureLabels,
  setLocalSeriesStyles,
  setLocalShowTitle,
} from '@/lib/local_storage';
import { VisualsMenubar } from '@/components/pages/visualize-outcomes/shared/visuals-menubar';
import { type SeriesStyles } from '@/lib/graphing/series-style';
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { getUniqueSessionConditions } from '@/lib/graphing/session-filters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/ui/back-button';
import { type FigureVisualSizing } from '@/types/accessibility';
import { Link } from '@tanstack/react-router';
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

  const [connectAllPoints, setConnectAllPointsState] = useState(() =>
    getLocalConnectSpans(Group, Individual, Evaluation, 'Rate'),
  );
  const setConnectAllPoints = (connect: boolean) => {
    setConnectAllPointsState(connect);
    setLocalConnectSpans(Group, Individual, Evaluation, 'Rate', connect);
  };
  // Matches the legend order (first appearance in results), so dialog rows and default colours line up with the chart
  const legendConditionOrder = getUniqueSessionConditions(ResultsFiltered);
  const styleConditions = [...legendConditionOrder, ...Conditions.filter((c) => !legendConditionOrder.includes(c))];
  const [schedule, setSchedule] = useState<ScheduleMappingOptionsType | { value: string; label: string }>(TimerMapping);
  const [seriesStyles, setSeriesStyles] = useState<SeriesStyles>(() =>
    getLocalSeriesStyles(Group, Individual, Evaluation),
  );

  const updateSeriesStyles = (next: SeriesStyles) => {
    setSeriesStyles(next);
    setLocalSeriesStyles(Group, Individual, Evaluation, next);
  };

  const toggleKeyVisibility = (keyDescription: string, visible: boolean) => {
    const updatedKeys = filteredKeys.map((k) => (k.KeyDescription === keyDescription ? { ...k, Visible: visible } : k));

    setFilteredKeys(updatedKeys);

    const hidden_keys = updatedKeys.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

    setLocalCachedPrefs(Group, Individual, Evaluation, 'Rate', {
      KeyDescription: hidden_keys,
      Schedule: schedule.value,
    });
  };

  const toggleConditionVisibility = (condition: string, visible: boolean) => {
    setFilteredConditions(filteredConditions.map((c) => (c.Condition === condition ? { ...c, Visible: visible } : c)));
  };
  const [figureTextSize, setFigureTextSize] = useState<FigureVisualSizing>('base');
  const [showTitle, setShowTitleState] = useState(() => getLocalShowTitle(Group, Individual, Evaluation, 'Rate'));
  const setShowTitle = (show: boolean) => {
    setShowTitleState(show);
    setLocalShowTitle(Group, Individual, Evaluation, 'Rate', show);
  };
  const [showTooltip, setShowTooltipState] = useState(() => getLocalShowTooltip(Group, Individual, Evaluation));
  const setShowTooltip = (show: boolean) => {
    setShowTooltipState(show);
    setLocalShowTooltip(Group, Individual, Evaluation, show);
  };
  const [showConditionLegend, setShowConditionLegendState] = useState(() =>
    getLocalShowConditionLegend(Group, Individual, Evaluation),
  );
  const setShowConditionLegend = (show: boolean) => {
    setShowConditionLegendState(show);
    setLocalShowConditionLegend(Group, Individual, Evaluation, show);
  };
  const [showDescription, setShowDescriptionState] = useState(() =>
    getLocalShowDescription(Group, Individual, Evaluation),
  );
  const setShowDescription = (show: boolean) => {
    setShowDescriptionState(show);
    setLocalShowDescription(Group, Individual, Evaluation, show);
  };

  const [figureLabels, setFigureLabelsState] = useState<FigureLabelSettings>(() =>
    getLocalFigureLabels(Group, Individual, Evaluation, 'Rate'),
  );
  const setFigureLabels = (labels: FigureLabelSettings) => {
    setFigureLabelsState(labels);
    setLocalFigureLabels(Group, Individual, Evaluation, 'Rate', labels);
  };
  const figureRef = useRef<HTMLDivElement>(null);

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
          <VisualsMenubar
            page="rate"
            keys={filteredKeys}
            onKeyVisibilityChange={toggleKeyVisibility}
            conditions={filteredConditions}
            onConditionVisibilityChange={toggleConditionVisibility}
            styleConditions={styleConditions}
            visibleStyleConditions={styleConditions.filter((c) =>
              filteredConditions.some((f) => f.Condition === c && f.Visible),
            )}
            styles={seriesStyles}
            onStylesChange={updateSeriesStyles}
            onSaveImage={(format) => saveChartImage(figureRef.current, format, `rate.${format}`)}
            figureTextSize={figureTextSize}
            onFigureTextSizeChange={setFigureTextSize}
            connectSpans={connectAllPoints}
            onConnectSpansChange={setConnectAllPoints}
            showTitle={showTitle}
            onShowTitleChange={setShowTitle}
            showTooltip={showTooltip}
            onShowTooltipChange={setShowTooltip}
            showConditionLegend={showConditionLegend}
            onShowConditionLegendChange={setShowConditionLegend}
            showDescription={showDescription}
            onShowDescriptionChange={setShowDescription}
            figureLabels={figureLabels}
            onFigureLabelsChange={setFigureLabels}
          />

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

        {showDescription ? (
          <p>
            This page provides a visual of the available data regarding <i>rate</i>. For convenience, series of data can
            be enabled or disabled for viewing. Similarly, an omnibus measure of behavior can be calculated by selecting
            which types of events to combine together using the optional logic builder. Options set here will persist
            for future visits.
          </p>
        ) : (
          <div className="h-[25px]" />
        )}

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
            ShowTitle={showTitle}
            ShowTooltip={showTooltip}
            ShowConditionLegend={showConditionLegend}
            FigureLabels={figureLabels}
            MinX={MinX}
            MaxX={MaxX}
            SeriesStyles={seriesStyles}
            divRef={figureRef}
          />
        )}
      </CardContent>
    </Card>
  );
}
