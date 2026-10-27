import { useState } from 'react';
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
import type { ChartImageFormat } from '@/components/pages/visualize-outcomes/shared/chart-export';
import { type ToggleDisplayCondition, type ToggleDisplayKey } from '@/types/visuals';
import { AimLinesDialog } from './dialogs/aim-lines-dialog';
import { PhaseChangesDialog } from './dialogs/phase-changes-dialog';
import { SeriesStylesDialog } from './dialogs/series-styles-dialog';
import { TextAnnotationsDialog } from './dialogs/text-annotations-dialog';
import { TitlesDialog } from './dialogs/titles-dialog';
import { LegendDialog } from './dialogs/legend-dialog';
import { type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type LegendSettings } from '@/lib/graphing/legend-settings';

type AnnotationDialog = 'series-styles' | 'phase-changes' | 'text-annotations' | 'aim-lines' | 'titles' | 'legend';

type Props = {
  page: TextPage;
  keys: ToggleDisplayKey[];
  onKeyVisibilityChange: (keyDescription: string, visible: boolean) => void;
  conditions: ToggleDisplayCondition[];
  onConditionVisibilityChange: (condition: string, visible: boolean) => void;
  styleConditions: string[];
  visibleStyleConditions: string[];
  styles: SeriesStyles;
  onStylesChange: (styles: SeriesStyles) => void;
  onSaveImage: (format: ChartImageFormat) => void;
  figureTextSize: FigureVisualSizing;
  onFigureTextSizeChange: (size: FigureVisualSizing) => void;
  connectSpans: boolean;
  onConnectSpansChange: (connect: boolean) => void;
  showTitle: boolean;
  onShowTitleChange: (show: boolean) => void;
  figureLabels: FigureLabelSettings;
  onFigureLabelsChange: (labels: FigureLabelSettings) => void;
  legendSettings: LegendSettings;
  onLegendSettingsChange: (settings: LegendSettings) => void;
  showTooltip: boolean;
  onShowTooltipChange: (show: boolean) => void;
  showConditionLegend: boolean;
  onShowConditionLegendChange: (show: boolean) => void;
  showDescription: boolean;
  onShowDescriptionChange: (show: boolean) => void;
};

/**
 * Menubar grouping visibility toggles and annotation editors for a visualization page
 *
 * Keys and conditions are checkable lists that report changes through the given callbacks, so the page keeps
 * ownership of their state. Annotation editors open the same dialogs used by the toolbar buttons.
 */
export function VisualsMenubar({
  page,
  keys,
  onKeyVisibilityChange,
  conditions,
  onConditionVisibilityChange,
  styleConditions,
  visibleStyleConditions,
  styles,
  onStylesChange,
  onSaveImage,
  figureTextSize,
  onFigureTextSizeChange,
  connectSpans,
  onConnectSpansChange,
  showTitle,
  onShowTitleChange,
  figureLabels,
  onFigureLabelsChange,
  legendSettings,
  onLegendSettingsChange,
  showTooltip,
  onShowTooltipChange,
  showConditionLegend,
  onShowConditionLegendChange,
  showDescription,
  onShowDescriptionChange,
}: Props) {
  const [activeDialog, setActiveDialog] = useState<AnnotationDialog | null>(null);

  const dialogOpenChange = (dialog: AnnotationDialog) => (next: boolean) => setActiveDialog(next ? dialog : null);

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
        <MenubarTrigger>Data</MenubarTrigger>
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
                  onCheckedChange={(checked) => onKeyVisibilityChange(key.KeyDescription, checked === true)}
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
                  onCheckedChange={(checked) => onConditionVisibilityChange(condition.Condition, checked === true)}
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
            onCheckedChange={(checked) => onConnectSpansChange(checked === true)}
          >
            Connect All Spans
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Design</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarSub>
            <MenubarSubTrigger>
              <ZoomInIcon className="mr-2 h-4 w-4" />
              Element Magnification
            </MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarRadioGroup
                value={figureTextSize}
                onValueChange={(value) => onFigureTextSizeChange(value as FigureVisualSizing)}
              >
                {FIGURE_TEXT_OPTIONS.map((opt) => (
                  <MenubarRadioItem key={opt.value} value={opt.value} onSelect={(event) => event.preventDefault()}>
                    {opt.label}
                  </MenubarRadioItem>
                ))}
              </MenubarRadioGroup>
            </MenubarSubContent>
          </MenubarSub>
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
                Text Annotations
              </MenubarItem>
              <MenubarItem onSelect={() => setActiveDialog('phase-changes')}>
                <RulerIcon className="mr-2 h-4 w-4" />
                Phase Changes
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem onSelect={() => setActiveDialog('series-styles')}>
            <PaintbrushIcon className="mr-2 h-4 w-4" />
            Series Styles
          </MenubarItem>
          <MenubarItem onSelect={() => setActiveDialog('titles')}>
            <CaseSensitiveIcon className="mr-2 h-4 w-4" />
            Titles and Labels
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            checked={showTitle}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onShowTitleChange(checked === true)}
          >
            Show Title
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={showConditionLegend}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onShowConditionLegendChange(checked === true)}
          >
            Show Condition Legend
          </MenubarCheckboxItem>
          <MenubarItem onSelect={() => setActiveDialog('legend')}>
            <PanelBottomIcon className="mr-2 h-4 w-4" />
            Legend Position and Layout
          </MenubarItem>
          <MenubarCheckboxItem
            checked={showTooltip}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onShowTooltipChange(checked === true)}
          >
            Enable Tooltip
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            checked={showDescription}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => onShowDescriptionChange(checked === true)}
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
        open={activeDialog === 'titles'}
        onOpenChange={dialogOpenChange('titles')}
      />
      <LegendDialog
        settings={legendSettings}
        onChange={onLegendSettingsChange}
        open={activeDialog === 'legend'}
        onOpenChange={dialogOpenChange('legend')}
      />
    </Menubar>
  );
}
