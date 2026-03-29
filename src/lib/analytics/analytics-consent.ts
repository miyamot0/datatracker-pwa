const STORAGE_KEY = 'analytics_consent';

export type AnalyticsConsent = 'granted' | 'denied';

/**
 * Pull consent response (opt-out model)
 *
 * @export string getConsent Returns 'granted' or 'denied' based on user preference, defaults to 'granted'
 */
export function getConsent(): AnalyticsConsent {
  return (localStorage.getItem(STORAGE_KEY) as AnalyticsConsent) || 'granted';
}

/**
 * Set consent response (opt-out model)
 *
 * @param {AnalyticsConsent} consent The user's consent preference, either 'granted' or 'denied'
 * @export void setConsent Updates the user's consent preference in local storage and dispatches a custom event to notify listeners of the change
 */
export function setConsent(consent: AnalyticsConsent) {
  localStorage.setItem(STORAGE_KEY, consent);

  // notify listeners (important for live updates)
  window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: consent }));
}

/**
 * Returns if consent provided
 *
 * @return {boolean} True if consent is granted, false otherwise
 */
export function hasConsent() {
  return getConsent() === 'granted';
}
