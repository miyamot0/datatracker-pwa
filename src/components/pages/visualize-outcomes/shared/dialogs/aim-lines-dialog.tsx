import { Fragment, useId, useRef, useState } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
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
  PHASE_LINE_TYPES,
  SERIES_COLOR_PALETTE,
  getPageAimLines,
  type AimLine,
  type PhaseLineType,
  type SeriesStyles,
  type TextPage,
} from '@/lib/graphing/series-style';

const LINE_TYPE_LABELS: Record<PhaseLineType, string> = {
  solid: 'Solid',
  dashed: 'Dashed',
  dotted: 'Dotted',
};

/**
 * An aim line being edited. Coordinates stay as typed text so partial input is not lost while the user types.
 */
type DraftRow = {
  id: number;
  x1: string;
  x2: string;
  y: string;
  lineType: PhaseLineType;
  color: string;
};

type Props = {
  styles: SeriesStyles;
  /** Page this dialog edits. Only aim lines added on this page are listed, and new aim lines are tagged with it. */
  page: TextPage;
  onChange: (styles: SeriesStyles) => void;
  /** Controlled open state, for opening the dialog from elsewhere (e.g. a menu) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Parses a typed coordinate. Returns undefined when the text is empty.
 */
function parseCoordinate(text: string): number | undefined {
  if (text.trim() === '') {
    return undefined;
  }

  return Number(text);
}

/**
 * Converts a draft row into a saved aim line. Returns undefined while X1, X2, or Y is missing or not a number.
 */
function toAimLine(row: DraftRow): AimLine | undefined {
  const x1 = parseCoordinate(row.x1);
  const x2 = parseCoordinate(row.x2);
  const y = parseCoordinate(row.y);

  if (x1 === undefined || x2 === undefined || y === undefined) {
    return undefined;
  }

  return { x1, x2, y, lineType: row.lineType, color: row.color };
}

/**
 * Dialog for adding, editing, and deleting aim lines drawn on a chart
 *
 * Each aim line is a horizontal line at a constant Y that spans from X1 to X2, in session units and the units of the
 * vertical axis. Rows with a missing or invalid coordinate are shown with an error and are not saved until they are
 * corrected. Changes are reported through onChange as a complete SeriesStyles object. Aim lines saved for the other page
 * are left unchanged.
 *
 * @param props.styles - Current saved styles, including the aim lines
 * @param props.page - Page the aim lines are edited for
 * @param props.onChange - Receives the updated styles after each edit
 */
export function AimLinesDialog({ styles, page, onChange, open: openProp, onOpenChange }: Props) {
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
        getPageAimLines(styles.aim_lines, page).map((aimLine) => ({
          id: nextRowId.current++,
          x1: String(aimLine.x1),
          x2: String(aimLine.x2),
          y: String(aimLine.y),
          lineType: aimLine.lineType,
          color: aimLine.color,
        })),
      );
    }
  }

  const commit = (nextRows: DraftRow[]) => {
    setRows(nextRows);

    const pageAimLines: AimLine[] = nextRows.flatMap((row) => {
      const aimLine = toAimLine(row);

      return aimLine === undefined ? [] : [{ ...aimLine, page }];
    });
    const otherPageAimLines = (styles.aim_lines ?? []).filter(
      (aimLine) => aimLine.page !== undefined && aimLine.page !== page,
    );

    onChange({ ...styles, aim_lines: [...otherPageAimLines, ...pageAimLines] });
  };

  const updateRow = (id: number, patch: Partial<Omit<DraftRow, 'id'>>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () =>
    commit([
      ...rows,
      { id: nextRowId.current++, x1: '', x2: '', y: '', lineType: 'dashed', color: SERIES_COLOR_PALETTE[0] },
    ]);

  const deleteRow = (id: number) => commit(rows.filter((row) => row.id !== id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {openProp === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit" aria-label="Edit Aim Lines">
            <MinusIcon className="lg:mr-2 w-4 h-4" />
            <span className="hidden lg:inline">Aim Lines</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aim Lines</DialogTitle>
          <DialogDescription>
            Draw a horizontal line from X1 to X2 at a constant Y. X is in session units and Y is in the units of the
            vertical axis.
          </DialogDescription>
        </DialogHeader>

        <section className="flex max-h-[50vh] flex-col overflow-y-auto pr-1">
          {rows.length === 0 && <p className="py-3 text-sm text-muted-foreground">No aim lines.</p>}

          {rows.map((row, index) => {
            const invalid = toAimLine(row) === undefined;
            const lineNumber = index + 1;
            const id = (field: string) => `${idPrefix}-${field}-${row.id}`;

            return (
              <Fragment key={row.id}>
                {index > 0 && <Separator />}
                <AnnotationRow
                  deleteLabel={`Delete aim line ${lineNumber}`}
                  onDelete={() => deleteRow(row.id)}
                  error={invalid ? 'Enter numbers for X1, X2, and Y to save this aim line.' : undefined}
                  fields={[
                    {
                      controlId: id('x1'),
                      label: 'X1',
                      control: (
                        <Input
                          id={id('x1')}
                          type="number"
                          step="any"
                          value={row.x1}
                          aria-label={`X1 for aim line ${lineNumber}`}
                          aria-invalid={parseCoordinate(row.x1) === undefined}
                          onChange={(event) => updateRow(row.id, { x1: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: id('x2'),
                      label: 'X2',
                      control: (
                        <Input
                          id={id('x2')}
                          type="number"
                          step="any"
                          value={row.x2}
                          aria-label={`X2 for aim line ${lineNumber}`}
                          aria-invalid={parseCoordinate(row.x2) === undefined}
                          onChange={(event) => updateRow(row.id, { x2: event.target.value })}
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
                          aria-label={`Y for aim line ${lineNumber}`}
                          aria-invalid={parseCoordinate(row.y) === undefined}
                          onChange={(event) => updateRow(row.id, { y: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: id('lineType'),
                      label: 'Line',
                      control: (
                        <Select
                          value={row.lineType}
                          onValueChange={(next) => updateRow(row.id, { lineType: next as PhaseLineType })}
                        >
                          <SelectTrigger
                            id={id('lineType')}
                            className="w-full"
                            aria-label={`Line type for aim line ${lineNumber}`}
                          >
                            <SelectValue>{LINE_TYPE_LABELS[row.lineType]}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {PHASE_LINE_TYPES.map((lineType) => (
                                <SelectItem key={lineType} value={lineType}>
                                  {LINE_TYPE_LABELS[lineType]}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ),
                    },
                    {
                      controlId: id('color'),
                      label: 'Color',
                      control: (
                        <Select value={row.color} onValueChange={(next) => updateRow(row.id, { color: next })}>
                          <SelectTrigger
                            id={id('color')}
                            className="w-full"
                            aria-label={`Color for aim line ${lineNumber}`}
                          >
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="inline-block h-3 w-3 rounded-full border"
                                  style={{ backgroundColor: row.color }}
                                />
                                {row.color}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {SERIES_COLOR_PALETTE.map((color) => (
                                <SelectItem key={color} value={color}>
                                  <span className="flex items-center gap-2">
                                    <span
                                      aria-hidden="true"
                                      className="inline-block h-3 w-3 rounded-full border"
                                      style={{ backgroundColor: color }}
                                    />
                                    {color}
                                  </span>
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
            Add Aim Line
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
