export function splitAtPoints<T>(arr: T[], points: number[]): T[][] {
  const result: T[][] = [];
  let start = 0;

  // Sort points and add end of array to ensure all segments are caught
  const cutPoints = [...points, arr.length].sort((a, b) => a - b);

  for (const point of cutPoints) {
    result.push(arr.slice(start, point));
    start = point;
  }

  return result;
}
