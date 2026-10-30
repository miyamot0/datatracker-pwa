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
import { FIGURE_LABEL_DEFAULTS, type FigureLabelSettings, type FigureLabels } from '@/lib/graphing/figure-labels';
import { type TextPage } from '@/lib/graphing/series-style';

type Props = {
  page: TextPage;
  labels: FigureLabelSettings;
  onChange: (labels: FigureLabelSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type AxisField = {
  name: string;
  defaultKey: keyof FigureLabels;
  overrideKey: keyof FigureLabelSettings;
  textKey: keyof FigureLabelSettings;
};

const AXIS_FIELDS: AxisField[] = [
  { name: 'X-Axis', defaultKey: 'xAxis', overrideKey: 'overrideXAxis', textKey: 'xAxisText' },
  { name: 'Y-Axis', defaultKey: 'yAxis', overrideKey: 'overrideYAxis', textKey: 'yAxisText' },
];

/**
 * Lets the user replace the X and Y axis labels. Each label falls back to its default unless overridden.
 */
export function AxisLabelsDialog({ page, labels, onChange, open, onOpenChange }: Props) {
  const id = useId();
  const defaults = FIGURE_LABEL_DEFAULTS[page];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Axis Labels</DialogTitle>
          <DialogDescription>
            Replace the X-Axis and Y-Axis labels. Labels that are not overridden, or are left blank, use the default
            shown below each field.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {AXIS_FIELDS.map((field) => {
            const checkboxId = `${id}-${field.overrideKey}`;
            const inputId = `${id}-${field.textKey}`;
            const enabled = labels[field.overrideKey] as boolean;
            const defaultText = defaults[field.defaultKey];

            return (
              <div key={field.overrideKey} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={enabled}
                    onCheckedChange={(checked) => onChange({ ...labels, [field.overrideKey]: checked === true })}
                  />
                  <Label htmlFor={checkboxId}>{`Override ${field.name}`}</Label>
                </div>
                <Input
                  id={inputId}
                  aria-label={`${field.name} Label Text`}
                  disabled={!enabled}
                  placeholder={defaultText}
                  value={labels[field.textKey] as string}
                  onChange={(event) => onChange({ ...labels, [field.textKey]: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">{`Default: ${defaultText}`}</p>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() =>
              onChange({ ...labels, overrideXAxis: false, xAxisText: '', overrideYAxis: false, yAxisText: '' })
            }
          >
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
