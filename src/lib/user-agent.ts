/**
 * Check if the user is on a mobile platform
 *
 * @returns {boolean} True if the user is on a mobile platform
 */
export function isOnMobilePlatform() {
  // Note: on TRUE, will hide, so a safe default

  const userAgent = navigator.userAgent;

  if (!userAgent) return true;

  return /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(userAgent);
}
