/**
 * This type is used to define the visual sizing options for figures in the application. It includes three predefined sizes: 'base', 'large', and 'extraLarge'. These sizes can be used to control the appearance of figures, such as images or charts, within the user interface, allowing for consistent styling and accessibility across the application.
 */
const figureVisualSizes = ['base', 'large', 'extraLarge'] as const;

/**
 * This type represents the allowed values for figure visual sizing, which are defined in the `figureVisualSizes` array. It ensures that any variable of this type can only take on one of the specified string values ('base', 'large', or 'extraLarge'), providing type safety and preventing invalid assignments.
 */
export type FigureVisualSizing = (typeof figureVisualSizes)[number];

/**
 * This constant defines the available options for figure visual sizing in the application. Each option consists of a `value`, which is one of the allowed `FigureVisualSizing` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred figure size. This structure facilitates both type safety and user-friendly interaction when configuring figure sizes in the application.
 */
export const FIGURE_TEXT_OPTIONS: { value: FigureVisualSizing; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'large', label: 'Large' },
  { value: 'extraLarge', label: 'Extra Large' },
];
