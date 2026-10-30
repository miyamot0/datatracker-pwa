import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type KeySelectOption = {
  KeyName: string;
  KeyDescription: string;
};

export type KeySelectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel: string;
  options: readonly KeySelectOption[];
  onSubmit: (keyName: string) => void;
};

export function KeySelectDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  options,
  onSubmit,
}: KeySelectDialogProps) {
  const selectId = useId();
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!value) {
      return;
    }

    onSubmit(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={selectId}>Key</Label>
            <Select value={value} onValueChange={setValue}>
              <SelectTrigger id={selectId} aria-label="Key">
                <SelectValue placeholder="Select a key" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.KeyName} value={option.KeyName}>
                    {`${option.KeyName} (${option.KeyDescription})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-md px-4 py-2"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 rounded-md px-4 py-2" disabled={!value}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
