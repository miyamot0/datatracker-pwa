import { useState } from 'react';
import { MinusIcon, PaintbrushIcon, RulerIcon, TypeIcon } from 'lucide-react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { type SeriesStyles, type TextPage } from '@/lib/graphing/series-style';
import { type ToggleDisplayCondition, type ToggleDisplayKey } from '@/types/visuals';
import { AimLinesDialog } from './dialogs/aim-lines-dialog';
import { PhaseChangesDialog } from './dialogs/phase-changes-dialog';
import { SeriesStylesDialog } from './dialogs/series-styles-dialog';
import { TextAnnotationsDialog } from './dialogs/text-annotations-dialog';

type AnnotationDialog = 'series-styles' | 'phase-changes' | 'text-annotations' | 'aim-lines';

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
}: Props) {
  const [activeDialog, setActiveDialog] = useState<AnnotationDialog | null>(null);

  const dialogOpenChange = (dialog: AnnotationDialog) => (next: boolean) => setActiveDialog(next ? dialog : null);

  return (
    <Menubar className="h-auto w-fit flex-wrap">
      <MenubarMenu>
        <MenubarTrigger>Keys</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarLabel>Toggle Visibility</MenubarLabel>
          <MenubarSeparator />
          {keys.map((key) => (
            <MenubarCheckboxItem
              key={key.KeyDescription}
              checked={key.Visible}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) => onKeyVisibilityChange(key.KeyDescription, checked === true)}
            >
              {key.KeyDescription}
            </MenubarCheckboxItem>
          ))}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Conditions</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarLabel>Toggle Visibility</MenubarLabel>
          <MenubarSeparator />
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
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Annotations</MenubarTrigger>
        <MenubarContent onCloseAutoFocus={(event) => event.preventDefault()}>
          <MenubarItem onSelect={() => setActiveDialog('series-styles')}>
            <PaintbrushIcon className="mr-2 h-4 w-4" />
            Series Styles
          </MenubarItem>
          <MenubarItem onSelect={() => setActiveDialog('phase-changes')}>
            <RulerIcon className="mr-2 h-4 w-4" />
            Phase Changes
          </MenubarItem>
          <MenubarItem onSelect={() => setActiveDialog('text-annotations')}>
            <TypeIcon className="mr-2 h-4 w-4" />
            Text Annotations
          </MenubarItem>
          <MenubarItem onSelect={() => setActiveDialog('aim-lines')}>
            <MinusIcon className="mr-2 h-4 w-4" />
            Aim Lines
          </MenubarItem>
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
    </Menubar>
  );
}
