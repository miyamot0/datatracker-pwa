// Trusted Types bootstrap policy.
// The default policy is used by legacy code paths that assign string values to script URL sinks.
(function () {
  'use strict';

  if (typeof window === 'undefined' || !window.trustedTypes || typeof window.trustedTypes.createPolicy !== 'function') {
    return;
  }

  const allowedOrigins = new Set([
    window.location.origin,
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://region1.google-analytics.com',
  ]);

  function toAbsoluteUrl(value) {
    try {
      return new URL(String(value), window.location.origin);
    } catch {
      return null;
    }
  }

  function allowScriptUrl(value) {
    const parsed = toAbsoluteUrl(value);
    if (!parsed) {
      throw new TypeError('Blocked invalid script URL for Trusted Types policy');
    }

    if (allowedOrigins.has(parsed.origin)) {
      return parsed.href;
    }

    throw new TypeError('Blocked disallowed script URL for Trusted Types policy: ' + parsed.origin);
  }

  try {
    window.trustedTypes.createPolicy('default', {
      createScriptURL: allowScriptUrl,
      createHTML: (value) => String(value),
      createScript: (value) => String(value),
    });
  } catch {
    // Ignore if a default policy already exists.
  }
})();
