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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EMPTY_FIGURE_AXIS_MAX_SETTINGS, type FigureAxisMaxSettings } from '@/lib/graphing/figure-text-settings';
import { type TextPage } from '@/lib/graphing/series-style';

type Props = {
  page: TextPage;
  axisMax: FigureAxisMaxSettings;
  onAxisMaxChange: (axisMax: FigureAxisMaxSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AxisMaxField = {
  name: string;
  overrideKey: keyof FigureAxisMaxSettings;
  valueKey: keyof FigureAxisMaxSettings;
};

const X_MAX_FIELD: AxisMaxField = { name: 'X-Axis', overrideKey: 'overrideXMax', valueKey: 'xMax' };
const Y_MAX_FIELD: AxisMaxField = { name: 'Y-Axis', overrideKey: 'overrideYMax', valueKey: 'yMax' };

/**
 * Lets the user override the maximum tick on each axis. The minimum always comes from the data.
 */
export function AxisLimitsDialog({ page, axisMax, onAxisMaxChange, open, onOpenChange }: Props) {
  const id = useId();
  // Proportion keeps its Y axis fixed at 0-100, so only Rate offers a Y max override
  const axisMaxFields = page === 'rate' ? [X_MAX_FIELD, Y_MAX_FIELD] : [X_MAX_FIELD];

  const onAxisMaxValueChange = (field: AxisMaxField, raw: string) => {
    if (raw.trim() === '') {
      onAxisMaxChange({ ...axisMax, [field.valueKey]: null });
      return;
    }
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed > 0) {
      onAxisMaxChange({ ...axisMax, [field.valueKey]: parsed });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Axis Limits</DialogTitle>
          <DialogDescription>
            Override the maximum tick on each axis. The minimum always comes from the data. Enter a whole number above
            the data's minimum; otherwise the data-derived maximum is used.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {axisMaxFields.map((field) => {
            const checkboxId = `${id}-${field.overrideKey}`;
            const inputId = `${id}-${field.valueKey}`;
            const enabled = axisMax[field.overrideKey] as boolean;
            const value = axisMax[field.valueKey] as number | null;

            return (
              <div key={field.overrideKey} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      onAxisMaxChange({ ...axisMax, [field.overrideKey]: checked === true })
                    }
                  />
                  <Label htmlFor={checkboxId}>{`Override ${field.name} Max`}</Label>
                </div>
                <Input
                  id={inputId}
                  type="number"
                  min={1}
                  step={1}
                  aria-label={`${field.name} Max`}
                  disabled={!enabled}
                  placeholder="Data"
                  className="w-28"
                  value={value ?? ''}
                  onChange={(event) => onAxisMaxValueChange(field, event.target.value)}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onAxisMaxChange(EMPTY_FIGURE_AXIS_MAX_SETTINGS)}>
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
