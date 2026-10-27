import { Fragment, useId, useRef, useState } from 'react';
import { PlusIcon, TypeIcon } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { AnnotationRow } from './annotation-row';
import { useDialogOpenState } from './use-dialog-open-state';
import {
  TEXT_ANCHORS,
  TEXT_JUSTIFIES,
  TEXT_LINE_BREAK,
  TEXT_WEIGHTS,
  getPageTextAnnotations,
  type TextPage,
  type SeriesStyles,
  type TextAnchor,
  type TextAnnotation,
  type TextJustify,
  type TextWeight,
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

const WEIGHT_LABELS: Record<TextWeight, string> = {
  normal: 'Normal',
  bold: 'Bold',
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
  weight: TextWeight;
};

type Props = {
  styles: SeriesStyles;
  /** Page this dialog edits. Only text added on this page is listed, and new text is tagged with it. */
  page: TextPage;
  onChange: (styles: SeriesStyles) => void;
  /** Controlled open state, for opening the dialog from elsewhere (e.g. a menu) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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

  return { label: row.label, x, y, anchor: row.anchor, justify: row.justify, weight: row.weight };
}

/**
 * Dialog for adding, editing, and deleting text annotations drawn on a chart
 *
 * Each annotation has a label, a weight, an x and y coordinate, an anchor point, and a justification. Use the literal text
 * \n in a label to start a new line. Rows missing a label or coordinate are shown with an error and are not saved until
 * they are corrected. Changes are reported through onChange as a complete SeriesStyles object. Text saved for the other
 * page is left unchanged.
 *
 * @param props.styles - Current saved styles, including the text annotations
 * @param props.page - Page the text is edited for
 * @param props.onChange - Receives the updated styles after each edit
 */
export function TextAnnotationsDialog({ styles, page, onChange, open: openProp, onOpenChange }: Props) {
  const [open, setOpen] = useDialogOpenState(openProp, onOpenChange);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [wasOpen, setWasOpen] = useState(false);
  const nextRowId = useRef(0);
  const idPrefix = useId();

  // Reloads draft rows whenever the dialog opens, whether from its trigger or a controlling parent
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setRows(
        getPageTextAnnotations(styles.text_annotations, page).map((annotation) => ({
          id: nextRowId.current++,
          label: annotation.label,
          x: String(annotation.x),
          y: String(annotation.y),
          anchor: annotation.anchor,
          justify: annotation.justify,
          weight: annotation.weight ?? 'normal',
        })),
      );
    }
  }

  const commit = (nextRows: DraftRow[]) => {
    setRows(nextRows);

    const pageAnnotations: TextAnnotation[] = nextRows.flatMap((row) => {
      const annotation = toAnnotation(row);

      return annotation === undefined ? [] : [{ ...annotation, page }];
    });
    const otherPageAnnotations = styles.text_annotations.filter(
      (annotation) => annotation.page !== undefined && annotation.page !== page,
    );

    onChange({ ...styles, text_annotations: [...otherPageAnnotations, ...pageAnnotations] });
  };

  const updateRow = (id: number, patch: Partial<Omit<DraftRow, 'id'>>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    commit([
      ...rows,
      { id: nextRowId.current++, label: '', x: '', y: '', anchor: 'middle-left', justify: 'left', weight: 'normal' },
    ]);

  const deleteRow = (id: number) => commit(rows.filter((row) => row.id !== id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit" aria-label="Edit Text Annotations">
            <TypeIcon className="md:mr-2 w-4 h-4" />
            <span className="hidden md:inline">Text</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Text Annotations</DialogTitle>
          <DialogDescription>
            Place text on the figure. X is in session units and Y is in the units of the vertical axis. Type{' '}
            {TEXT_LINE_BREAK} in a label to start a new line.
          </DialogDescription>
        </DialogHeader>

        <section className="flex max-h-[50vh] flex-col overflow-y-auto pr-1">
          {rows.length === 0 && <p className="py-3 text-sm text-muted-foreground">No text annotations.</p>}

          {rows.map((row, index) => {
            const invalid = toAnnotation(row) === undefined;
            const lineNumber = index + 1;
            const id = (field: string) => `${idPrefix}-${field}-${row.id}`;

            return (
              <Fragment key={row.id}>
                {index > 0 && <Separator />}
                <AnnotationRow
                  deleteLabel={`Delete text ${lineNumber}`}
                  onDelete={() => deleteRow(row.id)}
                  error={invalid ? 'Enter a label, and numbers for X and Y, to save this text.' : undefined}
                  fields={[
                    {
                      controlId: id('label'),
                      label: 'Label',
                      control: (
                        <Input
                          id={id('label')}
                          type="text"
                          value={row.label}
                          aria-label={`Label for text ${lineNumber}`}
                          aria-invalid={row.label.trim() === ''}
                          placeholder="Label"
                          onChange={(event) => updateRow(row.id, { label: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: id('weight'),
                      label: 'Weight',
                      control: (
                        <Select
                          value={row.weight}
                          onValueChange={(next) => updateRow(row.id, { weight: next as TextWeight })}
                        >
                          <SelectTrigger
                            id={id('weight')}
                            className="w-full"
                            aria-label={`Weight for text ${lineNumber}`}
                          >
                            <SelectValue>{WEIGHT_LABELS[row.weight]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {TEXT_WEIGHTS.map((weight) => (
                                <SelectItem key={weight} value={weight}>
                                  {WEIGHT_LABELS[weight]}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ),
                    },
                    {
                      controlId: id('x'),
                      label: 'X',
                      control: (
                        <Input
                          id={id('x')}
                          type="number"
                          step="any"
                          value={row.x}
                          aria-label={`X position for text ${lineNumber}`}
                          aria-invalid={parseCoordinate(row.x) === undefined}
                          placeholder="X"
                          onChange={(event) => updateRow(row.id, { x: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: id('y'),
                      label: 'Y',
                      control: (
                        <Input
                          id={id('y')}
                          type="number"
                          step="any"
                          value={row.y}
                          aria-label={`Y position for text ${lineNumber}`}
                          aria-invalid={parseCoordinate(row.y) === undefined}
                          placeholder="Y"
                          onChange={(event) => updateRow(row.id, { y: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: id('anchor'),
                      label: 'Anchor',
                      control: (
                        <Select
                          value={row.anchor}
                          onValueChange={(next) => updateRow(row.id, { anchor: next as TextAnchor })}
                        >
                          <SelectTrigger
                            id={id('anchor')}
                            className="w-full"
                            aria-label={`Anchor for text ${lineNumber}`}
                          >
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
                      ),
                    },
                    {
                      controlId: id('justify'),
                      label: 'Justify',
                      control: (
                        <Select
                          value={row.justify}
                          onValueChange={(next) => updateRow(row.id, { justify: next as TextJustify })}
                        >
                          <SelectTrigger
                            id={id('justify')}
                            className="w-full"
                            aria-label={`Justify for text ${lineNumber}`}
                          >
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
                      ),
                    },
                  ]}
                />
              </Fragment>
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
