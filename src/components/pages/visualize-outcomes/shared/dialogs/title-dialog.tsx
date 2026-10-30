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
import { FIGURE_LABEL_DEFAULTS, type FigureLabelSettings } from '@/lib/graphing/figure-labels';
import { type TextPage } from '@/lib/graphing/series-style';

type Props = {
  page: TextPage;
  labels: FigureLabelSettings;
  onChange: (labels: FigureLabelSettings) => void;
  showTitle: boolean;
  onShowTitleChange: (show: boolean) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Lets the user show, hide, or replace the figure title. The title falls back to its default unless overridden.
 */
export function TitleDialog({ page, labels, onChange, showTitle, onShowTitleChange, open, onOpenChange }: Props) {
  const id = useId();
  const defaultText = FIGURE_LABEL_DEFAULTS[page].title;
  const overrideId = `${id}-overrideTitle`;
  const inputId = `${id}-titleText`;
  const hideTitleId = `${id}-hide-title`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>
            Hide the figure title or replace it with custom text. When the override is off, or the text is left blank,
            the default title is used.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={overrideId}
                checked={labels.overrideTitle}
                onCheckedChange={(checked) => onChange({ ...labels, overrideTitle: checked === true })}
              />
              <Label htmlFor={overrideId}>Override Title</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id={hideTitleId}
                checked={!showTitle}
                onCheckedChange={(checked) => onShowTitleChange(checked !== true)}
              />
              <Label htmlFor={hideTitleId}>Hide Title</Label>
            </div>
          </div>
          <Input
            id={inputId}
            aria-label="Title Text"
            disabled={!labels.overrideTitle}
            placeholder={defaultText}
            value={labels.titleText}
            onChange={(event) => onChange({ ...labels, titleText: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">{`Default: ${defaultText}`}</p>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onChange({ ...labels, overrideTitle: false, titleText: '' })}>
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
