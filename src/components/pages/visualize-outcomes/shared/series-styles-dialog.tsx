import { useState, type ReactNode } from 'react';
import type { SymbolType } from 'recharts/types/util/types';
import { Symbols } from 'recharts';
import { PaintbrushIcon } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIGURE_PATH_COLORS } from '@/lib/colors';
import {
  EMPTY_SERIES_STYLES,
  DEFAULT_LINE_COLOR,
  MARKER_BORDER_COLOR,
  SERIES_COLOR_PALETTE,
  SERIES_SHAPES,
  TRANSPARENT_COLOR,
  resolveFillColor,
  resolveKeyFillColor,
  type KeySeriesStyle,
  type SeriesStyles,
} from '@/lib/graphing/series-style';
import { getShape } from '@/lib/shapes';

const DEFAULT_VALUE = 'default';
const CONTROL_WIDTH = 'w-48';
const KEY_CONTROL_WIDTH = 'w-fit min-w-48';

type DialogKey = {
  KeyDescription: string;
  Visible?: boolean;
};

type Props = {
  keys: DialogKey[];
  conditions: string[];
  visibleConditions: string[];
  styles: SeriesStyles;
  onChange: (styles: SeriesStyles) => void;
};

/**
 * Small filled circle showing a colour in dropdown options
 */
function Swatch({ color }: { color: string }) {
  return <span className="inline-block h-3 w-3 rounded-full border border-border" style={{ backgroundColor: color }} />;
}

/**
 * Filled glyph of a marker shape, used to label shape options
 */
function ShapeGlyph({ shape }: { shape: SymbolType }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0 text-foreground">
      <Symbols type={shape} cx={8} cy={8} size={96} sizeType="area" fill="currentColor" />
    </svg>
  );
}

/**
 * Shows the marker as it will render for the selected shape and fill, with the standard black border
 * A hidden fill is drawn as a dashed outline so the preview still shows where the marker sits.
 * 
 * @param shape - Marker shape to draw
 * @param fill - Resolved fill colour, or the transparent sentinel for a hidden marker
 */
function MarkerPreview({ shape, fill }: { shape: SymbolType; fill: string }) {
  const hidden = fill === TRANSPARENT_COLOR;

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      <Symbols
        type={shape}
        cx={10}
        cy={10}
        size={110}
        sizeType="area"
        fill={hidden ? TRANSPARENT_COLOR : fill}
        stroke={MARKER_BORDER_COLOR}
        strokeWidth={1}
        strokeDasharray={hidden ? '2 2' : undefined}
      />
    </svg>
  );
}

/**
 * Label on the left and a control on the right, shared by every row in the dialog
 */
function StyleRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Dropdown for choosing a colour, where Default clears the override
 *
 * The palette is always offered. Hidden is offered only when allowTransparent is set, because it applies to
 * per-condition fills and lines and not to condition-level fills.
 * 
 * @param value - Stored colour, or undefined when using the default
 * @param defaultColor - Colour shown next to the Default option
 * @param onChange - Receives the chosen colour, or undefined for Default
 * @param label - Accessible label for the trigger
 * @param allowTransparent - Whether to offer the Hidden option
 */
function ColorSelect({
  value,
  defaultColor,
  onChange,
  label,
  allowTransparent = false,
}: {
  value: string | undefined;
  defaultColor: string;
  onChange: (value: string | undefined) => void;
  label: string;
  allowTransparent?: boolean;
}) {
  return (
    <Select
      value={value ?? DEFAULT_VALUE}
      onValueChange={(next) => onChange(next === DEFAULT_VALUE ? undefined : next)}
    >
      <SelectTrigger className={CONTROL_WIDTH} aria-label={label}>
        <SelectValue placeholder="Default" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={DEFAULT_VALUE}>
            <span className="flex flex-row items-center gap-2">
              <Swatch color={defaultColor} />
              Default
            </span>
          </SelectItem>
          {allowTransparent && (
            <SelectItem value={TRANSPARENT_COLOR}>
              <span className="flex flex-row items-center gap-2">
                <Swatch color={TRANSPARENT_COLOR} />
                Hidden
              </span>
            </SelectItem>
          )}
          {SERIES_COLOR_PALETTE.map((color) => (
            <SelectItem key={color} value={color}>
              <span className="flex flex-row items-center gap-2">
                <Swatch color={color} />
                {color}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/**
 * Returns a copy of a record with one entry set, or removed when the value is undefined
 * 
 * @param record - Source record, which is not mutated
 * @param key - Entry to set or remove
 * @param value - New value, or undefined to remove the entry
 * @returns The updated copy
 */
function setOrDelete<T>(record: Record<string, T>, key: string, value: T | undefined): Record<string, T> {
  const next = { ...record };

  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }

  return next;
}

/**
 * Dialog for overriding series styles in a chart
 *
 * Condition fills are edited at the top. Key-specific settings (shape, per-condition fill, and per-condition line)
 * are edited one key at a time. Anything left at Default falls back to the standard figure style. Only visible
 * keys can be selected. Changes are reported through onChange as a complete SeriesStyles object.
 * 
 * @param props.keys - Keys in the chart, with their visibility
 * @param props.conditions - All conditions, used for the per-condition rows
 * @param props.visibleConditions - Conditions currently shown, used to derive default colours
 * @param props.styles - Current saved styles
 * @param props.onChange - Receives the updated styles after each edit
 */
export function SeriesStylesDialog({ keys, conditions, visibleConditions, styles, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  // Hidden keys are subsumed or not drawn, so they are not offered for styling
  const visibleKeys = keys.filter((key) => key.Visible === true);
  const keyDescriptions = visibleKeys.map((key) => key.KeyDescription);
  const activeKey = selectedKey && keyDescriptions.includes(selectedKey) ? selectedKey : keyDescriptions[0];

  // Mirrors the defaults drawn by BaseChart: colours by visible condition position, shapes by visible key position
  const defaultConditionColor = (condition: string) => {
    const visibleIndex = visibleConditions.indexOf(condition);
    const index = visibleIndex >= 0 ? visibleIndex : conditions.indexOf(condition);

    return FIGURE_PATH_COLORS[Math.max(index, 0) % FIGURE_PATH_COLORS.length];
  };

  const defaultShapeForKey = (key: string): SymbolType => getShape(Math.max(keyDescriptions.indexOf(key), 0));

  const updateKey = (key: string, patch: (current: KeySeriesStyle) => KeySeriesStyle) => {
    const current = styles.KeyStyles[key] ?? {};
    onChange({
      ...styles,
      KeyStyles: { ...styles.KeyStyles, [key]: patch(current) },
    });
  };

  const setShape = (key: string, shape: SymbolType | undefined) => updateKey(key, (current) => ({ ...current, shape }));

  const setFillColor = (key: string, condition: string, color: string | undefined) =>
    updateKey(key, (current) => ({
      ...current,
      fillColors: setOrDelete(current.fillColors ?? {}, condition, color),
    }));

  const setLineColor = (key: string, condition: string, color: string | undefined) =>
    updateKey(key, (current) => ({
      ...current,
      lineColors: setOrDelete(current.lineColors ?? {}, condition, color),
    }));

  const setConditionColor = (condition: string, color: string | undefined) =>
    onChange({
      ...styles,
      ConditionStyles: setOrDelete(styles.ConditionStyles, condition, color ? { color } : undefined),
    });

  const activeKeyStyle = activeKey ? styles.KeyStyles[activeKey] : undefined;
  const defaultShape = activeKey ? defaultShapeForKey(activeKey) : undefined;
  const effectiveShape = activeKeyStyle?.shape ?? defaultShape;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          <PaintbrushIcon className="mr-2 w-4 h-4" />
          Edit Series Styles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto data-[state=open]:slide-in-from-left-0! data-[state=open]:slide-in-from-top-0! data-[state=closed]:slide-out-to-left-0! data-[state=closed]:slide-out-to-top-0! data-[state=open]:zoom-in-100! data-[state=closed]:zoom-out-100!">
        <DialogHeader>
          <DialogTitle>Series Styles</DialogTitle>
          <DialogDescription>
            Override marker shapes, marker fills, and line colors. Marker borders are always black. Anything left at
            Default keeps the standard style for the figure.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Conditions</h3>
            {conditions.length === 0 && <p className="text-sm text-muted-foreground">No conditions available.</p>}
            {conditions.map((condition) => (
              <StyleRow key={`cond-${condition}`} label={`Marker Fill (${condition})`}>
                <ColorSelect
                  label={`Marker fill for ${condition}`}
                  value={styles.ConditionStyles[condition]?.color}
                  defaultColor={defaultConditionColor(condition)}
                  onChange={(color) => setConditionColor(condition, color)}
                />
              </StyleRow>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Keys</h3>
            {keyDescriptions.length === 0 && <p className="text-sm text-muted-foreground">No keys available.</p>}

            {activeKey && effectiveShape && (
              <>
                <StyleRow label="Key">
                  <Select value={activeKey} onValueChange={setSelectedKey}>
                    <SelectTrigger className={KEY_CONTROL_WIDTH} aria-label="Select key">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {keyDescriptions.map((key) => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </StyleRow>

                <StyleRow label="Shape">
                  <div className="flex flex-row items-center gap-2">
                    <ShapeGlyph shape={effectiveShape} />
                    <Select
                      value={activeKeyStyle?.shape ?? DEFAULT_VALUE}
                      onValueChange={(next) =>
                        setShape(activeKey, next === DEFAULT_VALUE ? undefined : (next as SymbolType))
                      }
                    >
                      <SelectTrigger className={CONTROL_WIDTH} aria-label={`Shape for ${activeKey}`}>
                        <SelectValue>{activeKeyStyle?.shape ?? `Default (${defaultShape})`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value={DEFAULT_VALUE}>
                            <span className="flex flex-row items-center gap-2">
                              <ShapeGlyph shape={defaultShape ?? effectiveShape} />
                              Default ({defaultShape})
                            </span>
                          </SelectItem>
                          {SERIES_SHAPES.map((shape) => (
                            <SelectItem key={shape} value={shape}>
                              <span className="flex flex-row items-center gap-2">
                                <ShapeGlyph shape={shape} />
                                {shape}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </StyleRow>

                {conditions.map((condition) => (
                  <StyleRow key={`fill-${condition}`} label={`Marker Fill (${condition})`}>
                    <div className="flex flex-row items-center gap-2">
                      <MarkerPreview
                        shape={effectiveShape}
                        fill={resolveKeyFillColor(styles, activeKey, condition, defaultConditionColor(condition))}
                      />
                      <ColorSelect
                        label={`Marker fill for ${activeKey} in ${condition}`}
                        value={activeKeyStyle?.fillColors?.[condition]}
                        allowTransparent
                        defaultColor={resolveFillColor(styles, condition, defaultConditionColor(condition))}
                        onChange={(color) => setFillColor(activeKey, condition, color)}
                      />
                    </div>
                  </StyleRow>
                ))}

                {conditions.map((condition) => (
                  <StyleRow key={`line-${condition}`} label={`Line (${condition})`}>
                    <ColorSelect
                      label={`Line color for ${activeKey} in ${condition}`}
                      value={activeKeyStyle?.lineColors?.[condition]}
                      allowTransparent
                      defaultColor={DEFAULT_LINE_COLOR}
                      onChange={(color) => setLineColor(activeKey, condition, color)}
                    />
                  </StyleRow>
                ))}
              </>
            )}
          </section>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onChange(EMPTY_SERIES_STYLES)}>
            Reset All to Defaults
          </Button>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
