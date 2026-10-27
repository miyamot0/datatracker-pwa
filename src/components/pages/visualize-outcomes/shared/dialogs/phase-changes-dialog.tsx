import { Fragment, useId, useRef, useState } from 'react';
import { PlusIcon, RulerIcon } from 'lucide-react';
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
import { PHASE_LINE_TYPES, type PhaseChange, type PhaseLineType, type SeriesStyles } from '@/lib/graphing/series-style';

const LINE_TYPE_LABELS: Record<PhaseLineType, string> = {
  solid: 'Solid',
  dashed: 'Dashed',
  dotted: 'Dotted',
};

/**
 * A line being edited. The position stays as typed text so partial input is not lost while the user types.
 */
type DraftRow = {
  id: number;
  position: string;
  lineType: PhaseLineType;
};

type Props = {
  styles: SeriesStyles;
  onChange: (styles: SeriesStyles) => void;
};

/**
 * Parses a typed position. Returns undefined when the text is not a finite number above zero.
 */
function parsePosition(text: string): number | undefined {
  if (text.trim() === '') {
    return undefined;
  }

  const value = Number(text);

  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Dialog for adding, editing, and deleting phase change lines drawn on a chart
 *
 * Each line has a position (a number above zero) and a line type. Rows with an invalid position are shown with an
 * error and are not saved until they are corrected. Changes are reported through onChange as a complete SeriesStyles
 * object, leaving the colour and shape styles unchanged.
 *
 * @param props.styles - Current saved styles, including the phase change lines
 * @param props.onChange - Receives the updated styles after each edit
 */
export function PhaseChangesDialog({ styles, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const nextRowId = useRef(0);
  const idPrefix = useId();

  const commit = (nextRows: DraftRow[]) => {
    setRows(nextRows);

    const phase_changes: PhaseChange[] = nextRows.flatMap((row) => {
      const position = parsePosition(row.position);

      return position === undefined ? [] : [{ position, lineType: row.lineType }];
    });

    onChange({ ...styles, phase_changes });
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setRows(
        styles.phase_changes.map((line) => ({
          id: nextRowId.current++,
          position: String(line.position),
          lineType: line.lineType,
        })),
      );
    }

    setOpen(next);
  };

  const updateRow = (id: number, patch: Partial<Omit<DraftRow, 'id'>>) =>
    commit(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const addRow = () => commit([...rows, { id: nextRowId.current++, position: '', lineType: 'solid' }]);

  const deleteRow = (id: number) => commit(rows.filter((row) => row.id !== id));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit" aria-label="Edit Phase Changes">
          <RulerIcon className="lg:mr-2 w-4 h-4" />
          <span className="hidden lg:inline">Phase Changes</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Phase Changes</DialogTitle>
          <DialogDescription>
            Draw vertical lines at a position on the x-axis. Positions must be a number greater than 0.
          </DialogDescription>
        </DialogHeader>

        <section className="flex max-h-[50vh] flex-col overflow-y-auto pr-1">
          {rows.length === 0 && <p className="py-3 text-sm text-muted-foreground">No phase change lines.</p>}

          {rows.map((row, index) => {
            const invalid = parsePosition(row.position) === undefined;
            const lineNumber = index + 1;
            const positionId = `${idPrefix}-position-${row.id}`;
            const lineTypeId = `${idPrefix}-line-type-${row.id}`;

            return (
              <Fragment key={row.id}>
                {index > 0 && <Separator />}
                <AnnotationRow
                  deleteLabel={`Delete line ${lineNumber}`}
                  onDelete={() => deleteRow(row.id)}
                  error={invalid ? 'Enter a number greater than 0 to save this line.' : undefined}
                  fields={[
                    {
                      controlId: positionId,
                      label: 'Position',
                      control: (
                        <Input
                          id={positionId}
                          type="number"
                          step="any"
                          min="0"
                          value={row.position}
                          aria-label={`Position for line ${lineNumber}`}
                          aria-invalid={invalid}
                          placeholder="Position"
                          onChange={(event) => updateRow(row.id, { position: event.target.value })}
                        />
                      ),
                    },
                    {
                      controlId: lineTypeId,
                      label: 'Line type',
                      control: (
                        <Select
                          value={row.lineType}
                          onValueChange={(next) => updateRow(row.id, { lineType: next as PhaseLineType })}
                        >
                          <SelectTrigger
                            id={lineTypeId}
                            className="w-full"
                            aria-label={`Line type for line ${lineNumber}`}
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
                  ]}
                />
              </Fragment>
            );
          })}
        </section>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={addRow}>
            <PlusIcon className="mr-2 w-4 h-4" />
            Add Line
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
