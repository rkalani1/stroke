// src/components/use-dialog-chrome.js
//
// Shared modal chrome for the two portalled sheets in the Trials tab
// (<TrialDetailsModal/> and <AddToHomeScreenSheet/>).
//
// app.jsx already implements body-scroll lock + Tab trap + focus restore, but
// that effect is keyed to app-level modal state (protocolModal, calcDrawerOpen,
// confirmConfig, paletteOpen). These sheets own their open state locally and
// set none of those, so they were getting none of it: Escape dropped focus to
// <body>, Tab walked out of the dialog into the page behind the scrim (which is
// neither inert nor aria-hidden, so aria-modal="true" was unbacked), and on iOS
// scrolling the sheet to its end chained through to the page underneath.
//
// This reproduces the same behaviour scoped to the sheet's own node rather than
// plumbing component-local state up to the app root. Deliberately mirrors
// app.jsx's trap (same focusable selector, same first/last wrap) and
// components.jsx's InteractiveImageLightbox (same save/restore of
// body.style.overflow and document.activeElement) so there is one pattern to
// reason about, not three.

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * @param {object}  opts
 * @param {object}  opts.dialogRef        ref to the dialog element (the Tab trap boundary)
 * @param {object}  [opts.initialFocusRef] ref to focus on open; defaults to the first focusable
 * @param {Function} opts.onClose         called on Escape
 */
export function useDialogChrome({ dialogRef, initialFocusRef, onClose }) {
  const previousActiveElementRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    previousActiveElementRef.current = document.activeElement;

    const focusInitial = () => {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
        return;
      }
      const first = dialogRef.current && dialogRef.current.querySelector(FOCUSABLE);
      if (first) first.focus();
    };
    focusInitial();

    // Scroll lock. Padding compensates for the scrollbar the lock removes, so
    // the page underneath does not shift while the sheet is open.
    const origOverflow = document.body.style.overflow;
    const origPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const node = dialogRef.current;
      if (!node) return;
      const focusable = node.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!node.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = origOverflow;
      document.body.style.paddingRight = origPaddingRight;
      const prev = previousActiveElementRef.current;
      if (prev && prev.isConnected && typeof prev.focus === 'function') prev.focus();
    };
  }, [dialogRef, initialFocusRef, onClose]);
}

export default useDialogChrome;
