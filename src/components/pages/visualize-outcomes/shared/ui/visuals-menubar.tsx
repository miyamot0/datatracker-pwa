import { lazy, Suspense, useState, type Dispatch } from 'react';
import {
  CaseSensitiveIcon,
  DownloadIcon,
  FileJsonIcon,
  FlaskConicalIcon,
  KeyRoundIcon,
  MessageSquareIcon,
  MinusIcon,
  PaintbrushIcon,
  PanelBottomIcon,
  RulerIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
  ZoomInIcon,
} from 'lucide-react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { FIGURE_TEXT_OPTIONS, type FigureVisualSizing } from '@/types/accessibility';
import { type SeriesStyles, type TextPage } from '@/lib/graphing/series-style';
import type { ChartImageFormat } from '@/components/pages/visualize-outcomes/shared/helpers/chart-export';
import type { VisualsSettingsAction, VisualsSettingsState } from '../helpers/visuals-settings-reducer';
// Loaded on demand so each dialog only downloads when opened
const SeriesStylesDialog = lazy(() =>
  import('../dialogs/series-styles-dialog').then((m) => ({ default: m.SeriesStylesDialog })),
);
const LegendDialog = lazy(() => import('../dialogs/legend-dialog').then((m) => ({ default: m.LegendDialog })));
const PhaseChangesDialog = lazy(() =>
  import('../dialogs/phase-changes-dialog').then((m) => ({ default: m.PhaseChangesDialog })),
);
const TextAnnotationsDialog = lazy(() =>
  import('../dialogs/text-annotations-dialog').then((m) => ({ default: m.TextAnnotationsDialog })),
);
const AimLinesDialog = lazy(() => import('../dialogs/aim-lines-dialog').then((m) => ({ default: m.AimLinesDialog })));
const TitlesDialog = lazy(() => import('../dialogs/titles-dialog').then((m) => ({ default: m.TitlesDialog })));
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type LegendSettings } from '@/lib/graphing/legend-settings';

type AnnotationDialog = 'series-styles' | 'phase-changes' | 'text-annotations' | 'aim-lines' | 'titles' | 'legend';

type Props = {
  page: TextPage;
  settings: VisualsSettingsState;
  dispatch: Dispatch<VisualsSettingsAction>;
  styleConditions: string[];
  visibleStyleConditions: string[];
  onSaveImage: (format: ChartImageFormat) => void;
  onWriteStyles: () => void;
  onReadStyles: () => void;
  onDeleteStyles: () => void;
};

/**
 * Menubar grouping visibility toggles and annotation editors for a visualization page
 *
 * Settings are read from the given state and changed by dispatching actions, so the page owns a single reducer.
 * Annotation editors open the same dialogs used by the toolbar buttons.
 */
export function VisualsMenubar({
  page,
  settings,
  dispatch,
  styleConditions,
  visibleStyleConditions,
  onSaveImage,
  onWriteStyles,
  onReadStyles,
  onDeleteStyles,
}: Props) {
  const {
    keys,
    conditions,
    seriesStyles: styles,
    figureTextSize,
    connectSpans,
    showTitle,
    figureLabels,
    legendSettings,
    showTooltip,
    showConditionLegend,
    showDescription,
  } = settings;
  const [activeDialog, setActiveDialog] = useState<AnnotationDialog | null>(null);

  const closeDialog = () => setActiveDialog(null);
  const onStylesChange = (next: SeriesStyles) => dispatch({ type: 'seriesStylesChanged', styles: next });
  const onFigureLabelsChange = (labels: FigureLabelSettings) => dispatch({ type: 'figureLabelsChanged', labels });
  const onLegendSettingsChange = (next: LegendSettings) => dispatch({ type: 'legendSettingsChanged', settings: next });
  const onShowTitleChange = (show: boolean) => dispatch({ type: 'showTitleChanged', show });
  const onShowConditionLegendChange = (show: boolean) => dispatch({ type: 'showConditionLegendChanged', show });

  return (
    <Menubar className="h-auto w-fit flex-wrap bg-card dark:[--accent:0_0%_40%] shadow-none">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarSub>
            <MenubarSubTrigger>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Figure Output
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => onSaveImage('svg')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Save to SVG
              </MenubarItem>
              <MenubarItem onSelect={() => onSaveImage('png')}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Save to PNG
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>
              <FileJsonIcon className="mr-2 h-4 w-4" />
              Style Information
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={onWriteStyles}>
                <FileJsonIcon className="mr-2 h-4 w-4" />
                Write styles.json
              </MenubarItem>
              <MenubarItem onSelect={onReadStyles}>
                <UploadIcon className="mr-2 h-4 w-4" />
                Read styles.json
              </MenubarItem>
              <MenubarItem onSelect={onDeleteStyles}>
                <Trash2Icon className="mr-2 h-4 w-4" />
                Delete styles.json
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Data Display</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarSub>
            <MenubarSubTrigger>
              <KeyRoundIcon className="mr-2 h-4 w-4" />
              Display Keys
            </MenubarSubTrigger>
            <MenubarSubContent>
              {keys.map((key) => (
                <MenubarCheckboxItem
                  key={key.KeyDescription}
                  checked={key.Visible}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    dispatch({
                      type: 'keyVisibilityChanged',
                      keyDescription: key.KeyDescription,
                      visible: checked === true,
                    })
                  }
                >
                  {key.KeyDescription}
                  {key.KeyType === 'Derived' && <span className="ml-2 text-xs text-muted-foreground">(Derived)</span>}
                </MenubarCheckboxItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>
              <FlaskConicalIcon className="mr-2 h-4 w-4" />
              Display Conditions
            </MenubarSubTrigger>
            <MenubarSubContent>
              {conditions.map((condition) => (
                <MenubarCheckboxItem
                  key={condition.Condition}
                  checked={condition.Visible}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(checked) =>
                    dispatch({
                      type: 'conditionVisibilityChanged',
                      condition: condition.Condition,
                      visible: checked === true,
                    })
                  }
                >
                  {condition.Condition}
                </MenubarCheckboxItem>
              ))}
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={connectSpans}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => dispatch({ type: 'connectSpansChanged', connect: checked === true })}
          >
            Connect All Spans
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Aesthetics</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarItem onSelect={() => setActiveDialog('titles')}>
            <CaseSensitiveIcon className="mr-2 h-4 w-4" />
            Titles and Labels
          </MenubarItem>

          <MenubarItem onSelect={() => setActiveDialog('legend')}>
            <PanelBottomIcon className="mr-2 h-4 w-4" />
            Legend Settings
          </MenubarItem>

          <MenubarItem onSelect={() => setActiveDialog('series-styles')}>
            <PaintbrushIcon className="mr-2 h-4 w-4" />
            Style Series
          </MenubarItem>

          <MenubarSub>
            <MenubarSubTrigger>
              <MessageSquareIcon className="mr-2 h-4 w-4" />
              Annotations
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => setActiveDialog('aim-lines')}>
                <MinusIcon className="mr-2 h-4 w-4" />
                Aim Lines
              </MenubarItem>
              <MenubarItem onSelect={() => setActiveDialog('text-annotations')}>
                <TypeIcon className="mr-2 h-4 w-4" />
                Text Labels
              </MenubarItem>
              <MenubarItem onSelect={() => setActiveDialog('phase-changes')}>
                <RulerIcon className="mr-2 h-4 w-4" />
                Phase Change Lines
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger>
              <ZoomInIcon className="mr-2 h-4 w-4" />
              Element Sizing
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={figureTextSize}
                onValueChange={(value) =>
                  dispatch({ type: 'figureTextSizeChanged', size: value as FigureVisualSizing })
                }
              >
                {FIGURE_TEXT_OPTIONS.map((opt) => (
                  <MenubarRadioItem key={opt.value} value={opt.value} onSelect={(event) => event.preventDefault()}>
                    {opt.label}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Settings</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarCheckboxItem
            checked={showTooltip}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => dispatch({ type: 'showTooltipChanged', show: checked === true })}
          >
            Enable Tooltip
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={showDescription}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => dispatch({ type: 'showDescriptionChanged', show: checked === true })}
          >
            Show Description
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <Suspense fallback={null}>
        {activeDialog === 'series-styles' && (
          <SeriesStylesDialog
            keys={keys}
            conditions={styleConditions}
            visibleConditions={visibleStyleConditions}
            styles={styles}
            onChange={onStylesChange}
            open={activeDialog === 'series-styles'}
            onOpenChange={closeDialog}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {activeDialog === 'phase-changes' && (
          <PhaseChangesDialog
            styles={styles}
            onChange={onStylesChange}
            open={activeDialog === 'phase-changes'}
            onOpenChange={closeDialog}
          />
        )}
        {activeDialog === 'text-annotations' && (
          <TextAnnotationsDialog
            page={page}
            styles={styles}
            onChange={onStylesChange}
            open={activeDialog === 'text-annotations'}
            onOpenChange={closeDialog}
          />
        )}
        {activeDialog === 'aim-lines' && (
          <AimLinesDialog
            page={page}
            styles={styles}
            onChange={onStylesChange}
            open={activeDialog === 'aim-lines'}
            onOpenChange={closeDialog}
          />
        )}
        {activeDialog === 'titles' && (
          <TitlesDialog
            page={page}
            labels={figureLabels}
            onChange={onFigureLabelsChange}
            showTitle={showTitle}
            onShowTitleChange={onShowTitleChange}
            open={activeDialog === 'titles'}
            onOpenChange={closeDialog}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
        {activeDialog === 'legend' && (
          <LegendDialog
            settings={legendSettings}
            onChange={onLegendSettingsChange}
            showConditionLegend={showConditionLegend}
            onShowConditionLegendChange={onShowConditionLegendChange}
            open={activeDialog === 'legend'}
            onOpenChange={closeDialog}
          />
        )}
      </Suspense>
    </Menubar>
  );
}
