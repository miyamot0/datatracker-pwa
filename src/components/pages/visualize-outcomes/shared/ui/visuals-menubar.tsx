import { useState, type Dispatch } from 'react';
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
  TypeIcon,
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
import { AimLinesDialog } from '../dialogs/aim-lines-dialog';
import { PhaseChangesDialog } from '../dialogs/phase-changes-dialog';
import { SeriesStylesDialog } from '../dialogs/series-styles-dialog';
import { TextAnnotationsDialog } from '../dialogs/text-annotations-dialog';
import { TitlesDialog } from '../dialogs/titles-dialog';
import { LegendDialog } from '../dialogs/legend-dialog';
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

  const dialogOpenChange = (dialog: AnnotationDialog) => (next: boolean) => setActiveDialog(next ? dialog : null);
  const onStylesChange = (next: SeriesStyles) => dispatch({ type: 'seriesStylesChanged', styles: next });
  const onFigureLabelsChange = (labels: FigureLabelSettings) => dispatch({ type: 'figureLabelsChanged', labels });
  const onLegendSettingsChange = (next: LegendSettings) => dispatch({ type: 'legendSettingsChanged', settings: next });
  const onShowTitleChange = (show: boolean) => dispatch({ type: 'showTitleChanged', show });
  const onShowConditionLegendChange = (show: boolean) => dispatch({ type: 'showConditionLegendChanged', show });

  return (
    <Menubar className="h-auto w-fit flex-wrap">
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
          <MenubarItem onSelect={() => console.log('Export Style: not implemented yet')}>
            <FileJsonIcon className="mr-2 h-4 w-4" />
            Export Style
          </MenubarItem>
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
                    dispatch({ type: 'keyVisibilityChanged', keyDescription: key.KeyDescription, visible: checked === true })
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
                    dispatch({ type: 'conditionVisibilityChanged', condition: condition.Condition, visible: checked === true })
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
                onValueChange={(value) => dispatch({ type: 'figureTextSizeChanged', size: value as FigureVisualSizing })}
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

      <SeriesStylesDialog
        keys={keys}
        conditions={styleConditions}
        visibleConditions={visibleStyleConditions}
        styles={styles}
        onChange={onStylesChange}
        open={activeDialog === 'series-styles'}
        onOpenChange={dialogOpenChange('series-styles')}
      />
      <PhaseChangesDialog
        styles={styles}
        onChange={onStylesChange}
        open={activeDialog === 'phase-changes'}
        onOpenChange={dialogOpenChange('phase-changes')}
      />
      <TextAnnotationsDialog
        page={page}
        styles={styles}
        onChange={onStylesChange}
        open={activeDialog === 'text-annotations'}
        onOpenChange={dialogOpenChange('text-annotations')}
      />
      <AimLinesDialog
        page={page}
        styles={styles}
        onChange={onStylesChange}
        open={activeDialog === 'aim-lines'}
        onOpenChange={dialogOpenChange('aim-lines')}
      />
      <TitlesDialog
        page={page}
        labels={figureLabels}
        onChange={onFigureLabelsChange}
        showTitle={showTitle}
        onShowTitleChange={onShowTitleChange}
        open={activeDialog === 'titles'}
        onOpenChange={dialogOpenChange('titles')}
      />
      <LegendDialog
        settings={legendSettings}
        onChange={onLegendSettingsChange}
        showConditionLegend={showConditionLegend}
        onShowConditionLegendChange={onShowConditionLegendChange}
        open={activeDialog === 'legend'}
        onOpenChange={dialogOpenChange('legend')}
      />
    </Menubar>
  );
}
