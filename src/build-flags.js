// Build-time deployment flags.
//
// scripts/build-browser.mjs replaces __STROKE_BUILD_PUBLIC_DEMO__ with a literal
// at bundle time. The committed/deployed app.js is always built with it set to
// true, so the public artifact runs in synthetic-demo mode on ANY host — not
// only when a hostname heuristic happens to match. A private, governed
// deployment must opt out explicitly at build time:
//
//   STROKE_BUILD_TARGET=private npm run build:js
//
// When the bundler did not define the flag (unit tests importing source
// directly), the value falls back to true: the safe default is demo mode.
/* global __STROKE_BUILD_PUBLIC_DEMO__ */
export const BUILD_PUBLIC_DEMO = typeof __STROKE_BUILD_PUBLIC_DEMO__ === 'boolean'
  ? __STROKE_BUILD_PUBLIC_DEMO__
  : true;

// Stamped into the DOM (data-build on the site footer) and asserted by
// tests/disclaimer-bundle.test.js: a committed app.js must contain only the
// public marker, never the private one.
export const BUILD_TARGET_MARKER = BUILD_PUBLIC_DEMO ? 'stroke-public-demo-build' : 'stroke-private-build';
