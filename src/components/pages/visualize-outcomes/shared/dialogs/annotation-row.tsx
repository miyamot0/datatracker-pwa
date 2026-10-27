import type { ReactNode } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export type AnnotationField = {
  /** Id of the control inside children, used to associate the visible label */
  controlId: string;
  label: string;
  control: ReactNode;
};

type Props = {
  fields: AnnotationField[];
  deleteLabel: string;
  onDelete: () => void;
  error?: string;
};

/**
 * One entry in an annotation dialog list. Fields are laid out as label and control pairs, two per line, and the delete
 * button sits at the far right edge.
 */
export function AnnotationRow({ fields, deleteLabel, onDelete, error }: Props) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-row items-start gap-4">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.controlId} className="flex min-w-0 flex-row items-center gap-2">
              <Label htmlFor={field.controlId} className="w-16 shrink-0">
                {field.label}
              </Label>
              <div className="min-w-0 flex-1">{field.control}</div>
            </div>
          ))}
        </div>

        <Button variant="destructive" size="icon" className="shrink-0" aria-label={deleteLabel} onClick={onDelete}>
          <Trash2Icon className="w-4 h-4" />
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
