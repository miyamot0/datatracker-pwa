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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateNewName } from '@/lib/name-validation';

export type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  entityLabel: string;
  submitLabel: string;
  initialValue?: string;
  /** Current name when renaming */
  previous?: string;
  existingNames: readonly string[];
  reservedNames?: readonly string[];
  onSubmit: (name: string) => void;
};

export function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  entityLabel,
  submitLabel,
  initialValue = '',
  previous,
  existingNames,
  reservedNames,
  onSubmit,
}: NameDialogProps) {
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState(initialValue);

  const error = validateNewName(value, { entityLabel, existingNames, reservedNames, previous });
  const showError = value.trim().length > 0 && error !== null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit(value.trim());
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
            <Label htmlFor={inputId}>{entityLabel} Name</Label>
            <Input
              id={inputId}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              aria-invalid={showError}
              aria-describedby={showError ? errorId : undefined}
            />
            {showError && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
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
            <Button type="submit" className="h-10 rounded-md px-4 py-2" disabled={error !== null}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
