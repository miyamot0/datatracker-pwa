import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge and conditionally join class names together, while also resolving conflicts between Tailwind CSS classes. This function takes in an array of class names or class name objects, uses the clsx library to conditionally join them together, and then uses the twMerge library to merge Tailwind CSS class names, ensuring that any conflicting classes are resolved correctly. The resulting string of class names can be used in a React component or any other context where class names are needed.
 *
 * @param inputs - an array of class names or class name objects to be merged into a single string of class names. This function uses the clsx library to conditionally join class names together and the twMerge library to merge Tailwind CSS class names, ensuring that conflicting classes are resolved correctly. The resulting string of class names can be used in a React component or any other context where class names are needed.
 * @returns a single string of class names that have been merged and resolved for conflicts, suitable for use in a React component or any other context where class names are needed.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
