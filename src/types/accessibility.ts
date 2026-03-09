// eslint-disable-next-line @typescript-eslint/no-unused-vars
const figureVisualSizes = ['base', 'large', 'extraLarge'] as const;

export type FigureVisualSizing = (typeof figureVisualSizes)[number];

export const FIGURE_TEXT_OPTIONS: { value: FigureVisualSizing; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'large', label: 'Large' },
  { value: 'extraLarge', label: 'Extra Large' },
];
