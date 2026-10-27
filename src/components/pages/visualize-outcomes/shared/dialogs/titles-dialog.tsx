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
import {
  EMPTY_FIGURE_LABEL_SETTINGS,
  FIGURE_LABEL_DEFAULTS,
  type FigureLabelSettings,
  type FigureLabels,
} from '@/lib/graphing/figure-labels';
import { type TextPage } from '@/lib/graphing/series-style';

type Props = {
  page: TextPage;
  labels: FigureLabelSettings;
  onChange: (labels: FigureLabelSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type LabelField = {
  name: string;
  defaultKey: keyof FigureLabels;
  overrideKey: keyof FigureLabelSettings;
  textKey: keyof FigureLabelSettings;
};

const FIELDS: LabelField[] = [
  { name: 'Title', defaultKey: 'title', overrideKey: 'overrideTitle', textKey: 'titleText' },
  { name: 'X-axis', defaultKey: 'xAxis', overrideKey: 'overrideXAxis', textKey: 'xAxisText' },
  { name: 'Y-axis', defaultKey: 'yAxis', overrideKey: 'overrideYAxis', textKey: 'yAxisText' },
];

/**
 * Lets the user replace a figure's title and axis labels. Each label falls back to its default unless overridden.
 */
export function TitlesDialog({ page, labels, onChange, open, onOpenChange }: Props) {
  const id = useId();
  const defaults = FIGURE_LABEL_DEFAULTS[page];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Titles and Labels</DialogTitle>
          <DialogDescription>
            Override the figure title and axis labels. Labels that are not overridden, or are left blank, use the
            default shown below each field.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {FIELDS.map((field) => {
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
                  <Label htmlFor={checkboxId}>{`Override ${field.name.toLowerCase()}`}</Label>
                </div>
                <Input
                  id={inputId}
                  aria-label={`${field.name} text`}
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
          <Button variant="outline" onClick={() => onChange(EMPTY_FIGURE_LABEL_SETTINGS)}>
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
