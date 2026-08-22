// src/components/InstallAppButton.jsx
//
// One control, three states — replaces the old Help + Install pair.
//
//   • Chrome / Edge / Android, where a BeforeInstallPromptEvent was captured:
//     the button fires the browser's own install prompt.
//   • iOS Safari (and anything else with no captured prompt): the button opens
//     a short "Add to Home Screen" sheet, because iOS has no install API.
//   • Already running standalone: a quiet "Installed" state.
//
// PWA state (`installPrompt`, `isInstalled`, `onInstall`) is owned by app.jsx —
// `beforeinstallprompt` fires once, early, so it has to be captured at the app
// root rather than by this component.

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogChrome } from './use-dialog-chrome.js';

const cx = (...p) => p.filter(Boolean).join(' ');

const Glyph = ({ children, size = 16, strokeWidth = 2.2, className }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

const IconDownload = (p) => (
  <Glyph {...p}>
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </Glyph>
);
const IconShare = (p) => (
  <Glyph {...p}>
    <path d="M12 16V4" />
    <path d="m8 8 4-4 4 4" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Glyph>
);
const IconCheck = (p) => (
  <Glyph {...p} strokeWidth={2.6}>
    <path d="m5 13 4 4L19 7" />
  </Glyph>
);
const IconClose = (p) => (
  <Glyph {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Glyph>
);

const STEPS = [
  <>Tap the <strong className="font-bold text-ink">Share</strong> button in the browser toolbar.</>,
  <>Scroll down and choose <strong className="font-bold text-ink">Add to Home Screen</strong>.</>,
  <>Tap <strong className="font-bold text-ink">Add</strong>. Stroke opens full-screen from the home screen.</>
];

function AddToHomeScreenSheet({ onClose }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  // Escape + Tab trap + body scroll lock + focus restore (see use-dialog-chrome.js).
  useDialogChrome({ dialogRef, initialFocusRef: closeRef, onClose });

  // Portalled to <body>: .app-shell carries a backdrop-filter, which makes it
  // the containing block for position:fixed descendants — the sheet would
  // otherwise anchor to the shell's box rather than the viewport.
  return createPortal(
    <>
      <div className="fixed inset-0 z-[70] bg-slate-950/50" onClick={onClose} role="presentation" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        className="fixed inset-x-0 bottom-0 z-[71] rounded-t-xl border border-line bg-card p-5 shadow-pop sm:inset-x-4 sm:bottom-auto sm:top-1/2 sm:mx-auto sm:max-w-md sm:-translate-y-1/2 sm:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cobalt-200 bg-cobalt-50 text-cobalt-700 dark:border-cobalt-700 dark:bg-cobalt-900 dark:text-cobalt-300"
            >
              <IconShare size={19} />
            </span>
            <div>
              <h2 id="install-sheet-title" className="font-serif text-md font-bold tracking-tight text-ink">
                Add to Home Screen
              </h2>
              <p className="mt-0.5 text-xs text-mute">Opens full-screen, works offline</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close install instructions"
            className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-mute hover:bg-paper-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
          >
            <IconClose size={18} />
          </button>
        </div>

        <ol className="mt-4 space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-cobalt-600 font-mono text-2xs font-semibold text-white dark:bg-cobalt-500"
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-ink-2">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-4 border-t border-paper-2 pt-3 text-xs leading-relaxed text-mute">
          No app store and no account — the home-screen icon opens this same page, with the trial tables cached for offline use.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-cobalt-600 px-4 text-sm font-bold text-white hover:bg-cobalt-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 dark:bg-cobalt-500 dark:hover:bg-cobalt-600"
        >
          Got it
        </button>
      </div>
    </>,
    document.body
  );
}

export function InstallAppButton({ installPrompt, isInstalled, onInstall, className }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isInstalled) {
    return (
      <span
        className={cx(
          'inline-flex min-h-[40px] items-center gap-2 rounded-pill border border-ok-200 bg-ok-50 px-4 text-xs font-bold text-ok-800 dark:border-ok-800 dark:bg-ok-950 dark:text-ok-200',
          className
        )}
      >
        <IconCheck size={15} />
        Installed
      </span>
    );
  }

  const hasNativePrompt = Boolean(installPrompt);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (hasNativePrompt && typeof onInstall === 'function') onInstall();
          else setSheetOpen(true);
        }}
        className={cx(
          'inline-flex min-h-[40px] items-center gap-2 rounded-pill border px-4 text-xs font-bold transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          hasNativePrompt
            ? 'border-cobalt-600 bg-cobalt-600 text-white hover:bg-cobalt-700 dark:bg-cobalt-500 dark:hover:bg-cobalt-600'
            : 'border-cobalt-600 bg-card text-cobalt-700 hover:bg-cobalt-50 dark:border-cobalt-400 dark:text-cobalt-300 dark:hover:bg-cobalt-900',
          className
        )}
      >
        {hasNativePrompt ? <IconDownload size={15} /> : <IconShare size={15} />}
        Install App
      </button>
      {sheetOpen && <AddToHomeScreenSheet onClose={() => setSheetOpen(false)} />}
    </>
  );
}

export default InstallAppButton;
