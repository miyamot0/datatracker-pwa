/**
 * Formats a number of seconds into a string in the format HH:MM:SS
 *
 * @param seconds number of seconds
 * @returns a string representing the formatted time in HH:MM:SS format
 */
export function formatTimeSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining_seconds = seconds % 60;

  const str_hours = hours.toString().padStart(2, '0');
  const str_minutes = minutes.toString().padStart(2, '0');

  const str_seconds = remaining_seconds < 10 ? `0${remaining_seconds.toFixed(2)}` : remaining_seconds.toFixed(2);

  return `${str_hours}:${str_minutes}:${str_seconds}`;
}

/**
 * Formats a number of seconds into a string in the format MM:SS
 *
 * @param seconds number of seconds
 * @returns a string representing the formatted time in MM:SS format
 */
export function formatTimeSecondsMin(seconds: number) {
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining_seconds = seconds % 60;

  const str_minutes = minutes.toString().padStart(2, '0');

  const str_seconds = remaining_seconds < 10 ? `0${remaining_seconds.toFixed(0)}` : remaining_seconds.toFixed(0);

  return `${str_minutes}:${str_seconds}`;
}

/**
 * Formats a date object into a string in the format HH:MM:SS
 *
 * @param date date object
 * @returns a string representing the formatted time in HH:MM:SS format
 */
export function formatTimeOfDay(date: Date) {
  return date.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
