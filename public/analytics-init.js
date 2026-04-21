// Google Analytics initialization script
// This external script replaces inline JavaScript for better CSP compliance

(function () {
  'use strict';

  // Initialize dataLayer before gtag library loads
  window.dataLayer = window.dataLayer || [];

  function gtag() {
    dataLayer.push(arguments);
  }

  // Make gtag globally available
  window.gtag = gtag;

  // Set up initial configuration
  gtag('js', new Date());

  // Configuration will be set up by the main application
  // This script just provides the foundation
})();
