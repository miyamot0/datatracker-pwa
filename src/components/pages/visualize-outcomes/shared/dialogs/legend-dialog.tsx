import { useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DEFAULT_LEGEND_SETTINGS,
  LEGEND_LAYOUT_LABELS,
  LEGEND_LAYOUTS,
  LEGEND_POSITION_LABELS,
  LEGEND_POSITIONS,
  type LegendLayout,
  type LegendPosition,
  type LegendSettings,
} from '@/lib/graphing/legend-settings';

type Props = {
  settings: LegendSettings;
  onChange: (settings: LegendSettings) => void;
  showConditionLegend: boolean;
  onShowConditionLegendChange: (show: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Lets the user choose where a figure's legend is drawn, whether its entries run across or down, and whether the
 * condition entries appear in it.
 */
export function LegendDialog({
  settings,
  onChange,
  showConditionLegend,
  onShowConditionLegendChange,
  open,
  onOpenChange,
}: Props) {
  const id = useId();
  const positionId = `${id}-legend-position`;
  const layoutId = `${id}-legend-layout`;
  const conditionId = `${id}-legend-conditions`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Legend Position and Layout</DialogTitle>
          <DialogDescription>
            Choose where the legend is drawn on the figure and whether its entries run horizontally or vertically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-row items-center justify-between gap-4">
            <Label htmlFor={positionId}>Position</Label>
            <Select
              value={settings.position}
              onValueChange={(next) => onChange({ ...settings, position: next as LegendPosition })}
            >
              <SelectTrigger id={positionId} className="w-48" aria-label="Legend position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LEGEND_POSITIONS.map((position) => (
                    <SelectItem key={position} value={position}>
                      {LEGEND_POSITION_LABELS[position]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center justify-between gap-4">
            <Label htmlFor={layoutId}>Layout</Label>
            <Select
              value={settings.layout}
              onValueChange={(next) => onChange({ ...settings, layout: next as LegendLayout })}
            >
              <SelectTrigger id={layoutId} className="w-48" aria-label="Legend layout">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LEGEND_LAYOUTS.map((layout) => (
                    <SelectItem key={layout} value={layout}>
                      {LEGEND_LAYOUT_LABELS[layout]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center justify-between gap-4">
            <Label htmlFor={conditionId}>Conditions in Legend</Label>
            <Checkbox
              id={conditionId}
              checked={showConditionLegend}
              onCheckedChange={(checked) => onShowConditionLegendChange(checked === true)}
            />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onChange(DEFAULT_LEGEND_SETTINGS)}>
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
