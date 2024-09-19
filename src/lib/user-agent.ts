/**
 * Check if the user is on a mobile platform
 *
 * @returns {boolean} True if the user is on a mobile platform
 */
export function isOnMobilePlatform() {
  //@ts-expect-error - navigator.userAgent is not typed correctly
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(userAgent.userAgent);
}
