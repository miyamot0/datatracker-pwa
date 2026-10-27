import { useRef, useState } from 'react';
import { PlusIcon, Trash2Icon, TypeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TEXT_ANCHORS,
  TEXT_JUSTIFIES,
  TEXT_LINE_BREAK,
  type SeriesStyles,
  type TextAnchor,
  type TextAnnotation,
  type TextJustify,
} from '@/lib/graphing/series-style';

const ANCHOR_LABELS: Record<TextAnchor, string> = {
  'top-left': 'Top left',
  'top-center': 'Top center',
  'top-right': 'Top right',
  'middle-left': 'Middle left',
  'middle-center': 'Middle center',
  'middle-right': 'Middle right',
  'bottom-left': 'Bottom left',
  'bottom-center': 'Bottom center',
  'bottom-right': 'Bottom right',
};

const JUSTIFY_LABELS: Record<TextJustify, string> = {
  left: 'Left',
  center: 'Center',
  right: 'Right',
};

/**
 * A text annotation being edited. Coordinates stay as typed text so partial input is not lost while the user types.
 */
type DraftRow = {
  id: number;
  label: string;
  x: string;
  y: string;
  anchor: TextAnchor;
  justify: TextJustify;
};

type Props = {
  styles: SeriesStyles;
  onChange: (styles: SeriesStyles) => void;
};

/**
 * Parses a typed coordinate. Returns undefined when the text is not a finite number.
 */
function parseCoordinate(text: string): number | undefined {
  if (text.trim() === '') {
    return undefined;
  }

  const value = Number(text);

  return Number.isFinite(value) ? value : undefined;
}

/**
 * Converts a draft row into a saved annotation. Returns undefined while the label or a coordinate is missing.
 */
function toAnnotation(row: DraftRow): TextAnnotation | undefined {
  const x = parseCoordinate(row.x);
  const y = parseCoordinate(row.y);

  if (row.label.trim() === '' || x === undefined || y === undefined) {
    return undefined;
  }

  return { label: row.label, x, y, anchor: row.anchor, justify: row.justify };
}

/**
 * Dialog for adding, editing, and deleting text annotations drawn on a chart
 *
 * Each annotation has a label, an x and y coordinate, an anchor point, and a justification. Use the literal text \n in
 * a label to start a new line. Rows missing a label or coordinate are shown with an error and are not saved until they
 * are corrected. Changes are reported through onChange as a complete SeriesStyles object, leaving the other styles
 * unchanged.
 *
 * @param props.styles - Current saved styles, including the text annotations
 * @param props.onChange - Receives the updated styles after each edit
 */
export function TextAnnotationsDialog({ styles, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const nextRowId = useRef(0);

  const commit = (nextRows: DraftRow[]) => {
    setRows(nextRows);

    const text_annotations: TextAnnotation[] = nextRows.flatMap((row) => {
      const annotation = toAnnotation(row);

      return annotation === undefined ? [] : [annotation];
    });

    onChange({ ...styles, text_annotations });
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setRows(
        styles.text_annotations.map((annotation) => ({
          id: nextRowId.current++,
          label: annotation.label,
          x: String(annotation.x),
          y: String(annotation.y),
          anchor: annotation.anchor,
          justify: annotation.justify,
        })),
      );
    }

    setOpen(next);
  };

  const updateRow = (id: number, patch: Partial<Omit<DraftRow, 'id'>>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    commit([
      ...rows,
      { id: nextRowId.current++, label: '', x: '', y: '', anchor: 'bottom-left', justify: 'left' },
    ]);

  const deleteRow = (id: number) => commit(rows.filter((row) => row.id !== id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit" aria-label="Edit Text Annotations">
          <TypeIcon className="md:mr-2 w-4 h-4" />
          <span className="hidden md:inline">Text</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Text Annotations</DialogTitle>
          <DialogDescription>
            Place text on the figure. X is in session units and Y is in the units of the vertical axis. Type {TEXT_LINE_BREAK}{' '}
            in a label to start a new line.
          </DialogDescription>
        </DialogHeader>

        <section className="flex flex-col gap-3">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No text annotations.</p>}

          {rows.map((row, index) => {
            const invalid = toAnnotation(row) === undefined;
            const lineNumber = index + 1;

            return (
              <div key={row.id} className="flex flex-col gap-1">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    className="w-64"
                    value={row.label}
                    aria-label={`Label for text ${lineNumber}`}
                    aria-invalid={row.label.trim() === ''}
                    placeholder="Label"
                    onChange={(event) => updateRow(row.id, { label: event.target.value })}
                  />

                  <Input
                    type="number"
                    step="any"
                    className="w-28"
                    value={row.x}
                    aria-label={`X position for text ${lineNumber}`}
                    aria-invalid={parseCoordinate(row.x) === undefined}
                    placeholder="X"
                    onChange={(event) => updateRow(row.id, { x: event.target.value })}
                  />

                  <Input
                    type="number"
                    step="any"
                    className="w-28"
                    value={row.y}
                    aria-label={`Y position for text ${lineNumber}`}
                    aria-invalid={parseCoordinate(row.y) === undefined}
                    placeholder="Y"
                    onChange={(event) => updateRow(row.id, { y: event.target.value })}
                  />

                  <Select value={row.anchor} onValueChange={(next) => updateRow(row.id, { anchor: next as TextAnchor })}>
                    <SelectTrigger className="w-40" aria-label={`Anchor for text ${lineNumber}`}>
                      <SelectValue>{ANCHOR_LABELS[row.anchor]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TEXT_ANCHORS.map((anchor) => (
                          <SelectItem key={anchor} value={anchor}>
                            {ANCHOR_LABELS[anchor]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={row.justify}
                    onValueChange={(next) => updateRow(row.id, { justify: next as TextJustify })}
                  >
                    <SelectTrigger className="w-32" aria-label={`Justify for text ${lineNumber}`}>
                      <SelectValue>{JUSTIFY_LABELS[row.justify]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {TEXT_JUSTIFIES.map((justify) => (
                          <SelectItem key={justify} value={justify}>
                            {JUSTIFY_LABELS[justify]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete text ${lineNumber}`}
                    onClick={() => deleteRow(row.id)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                </div>

                {invalid && (
                  <p className="text-sm text-destructive">
                    Enter a label, and numbers for X and Y, to save this text.
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={addRow}>
            <PlusIcon className="mr-2 w-4 h-4" />
            Add Text
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
