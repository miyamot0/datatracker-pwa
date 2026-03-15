import { SymbolType } from 'recharts/types/util/types';

/**
 * Determine the shape for a data point based on its index, cycling through a predefined set of shapes every 7 indices
 *
 * @param index The index of the data point for which to determine the shape
 * @returns a symbol type for the data point based on its index, cycling through a predefined set of shapes every 7 indices
 */
export function getShape(index: number) {
  const index_shape = index % 7;

  let shape: SymbolType = 'circle';

  switch (index_shape) {
    case 0:
      shape = 'circle';
      break;
    case 1:
      shape = 'cross';
      break;
    case 2:
      shape = 'diamond';
      break;
    case 3:
      shape = 'square';
      break;
    case 4:
      shape = 'star';
      break;
    case 5:
      shape = 'triangle';
      break;
    case 6:
      shape = 'wye';
      break;
  }

  return shape;
}
