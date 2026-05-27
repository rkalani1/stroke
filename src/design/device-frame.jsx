/**
 * v7.0 — DeviceFrame. The hero deliverable of v7.
 * Drop-in: src/design/device-frame.jsx
 *
 * Wraps the Trials iframes (bedside-screener + eligibility-tables-embed)
 * with intentional parent chrome. No edits to embed sources required.
 *
 * Light: 2px slate-200 border + 12px radius → seam reads deliberate.
 * Dark:  1px slate-800 border, parent canvas matches child canvas → seam disappears.
 *
 * postMessage('resize') handshake: child apps emit {type:'iframe-resize', height:N}
 * → parent sets iframe height. 1.5s timeout falls back to min-height
 * min(80vh, 1200px). No-op if child doesn't cooperate.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from './primitives.jsx';

const cx = (...p) => p.filter(Boolean).join(' ');

/* Listen for postMessage from a specific child iframe. Strict origin check
   so a malicious sibling iframe can't spoof a resize event. */
const useIframeMessage = (iframeRef, expectedOrigin, onMessage) => {
  useEffect(() => {
    const handler = (ev) => {
      if (!iframeRef.current) return;
      if (ev.source !== iframeRef.current.contentWindow) return;
      if (expectedOrigin && ev.origin !== expectedOrigin) return;
      onMessage(ev.data);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [iframeRef, expectedOrigin, onMessage]);
};

/**
 * <DeviceFrame>
 * @param {string} src           iframe URL
 * @param {string} title         iframe accessible title
 * @param {string} breadcrumb    "Trials Screener · Bedside · pre-filled from chart"
 * @param {string} poweredBy     attribution string
 * @param {string} openHref      "open in new tab" URL (usually === src)
 * @param {string} sandbox       sandbox attr (preserves existing impl's value)
 * @param {number} minHeight     fallback minHeight in px (default 0.8*vh capped 1200)
 */
export const DeviceFrame = ({
  src, title, breadcrumb, poweredBy, openHref, sandbox,
  minHeight,
  className
}) => {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(null);   /* null = loading skeleton */
  const [loaded, setLoaded] = useState(false);  /* true after 240ms fade-in */
  const timeoutRef = useRef(null);

  const fallback = minHeight ?? Math.min(Math.round(0.8 * (typeof window !== 'undefined' ? window.innerHeight : 800)), 1200);

  /* postMessage handshake — strict origin check derived from src. */
  const expectedOrigin = (() => {
    try { return new URL(src).origin; } catch { return null; }
  })();

  useIframeMessage(iframeRef, expectedOrigin, (data) => {
    if (data?.type === 'iframe-resize' && typeof data.height === 'number') {
      setHeight(Math.min(data.height, 4000));   /* hard cap */
    }
    if (data?.type === 'ready') {
      markLoaded();
    }
  });

  const markLoaded = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoaded(true);
    if (height === null) setHeight(fallback);
  };

  /* 1.5s timeout fail-open. iframe.onload also markLoaded directly. */
  useEffect(() => {
    timeoutRef.current = setTimeout(markLoaded, 1500);
    return () => timeoutRef.current && clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolvedHeight = height ?? fallback;

  return (
    <div className={cx(
      'rounded-lg overflow-hidden',
      'border-2 border-slate-200 bg-white',
      'dark:border dark:border-slate-800 dark:bg-slate-950',
      className
    )}>
      {/* Parent breadcrumb header — sticky 40px */}
      <div className="flex items-center justify-between gap-3 px-4 h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-10">
        <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{breadcrumb}</p>
        {openHref && (
          <a href={openHref} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-xs font-semibold text-link-600 dark:text-link-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 rounded">
            Open in new tab ↗
          </a>
        )}
      </div>

      {/* Iframe area with skeleton underlay */}
      <div className="relative bg-white dark:bg-slate-950" style={{ minHeight: resolvedHeight }}>
        {!loaded && (
          <div className="absolute inset-0 p-5 space-y-3" aria-hidden="true">
            <Skeleton className="h-8 w-2/3"/>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-24"/><Skeleton className="h-24"/>
            </div>
            <Skeleton className="h-32"/>
            <Skeleton className="h-6 w-1/3"/>
            <Skeleton className="h-20"/>
          </div>
        )}
        {src && (
          <iframe
            ref={iframeRef}
            src={src}
            title={title}
            loading="lazy"
            sandbox={sandbox}
            onLoad={markLoaded}
            className={cx(
              'w-full block transition-opacity duration-[240ms] motion-reduce:duration-0',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
            style={{ height: resolvedHeight, border: 0 }}
          />
        )}
      </div>

      {/* Parent footer — attribution */}
      <div className="flex items-center justify-between gap-3 px-4 h-9 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <p className="font-mono text-2xs uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
          Powered by <span className="text-slate-700 dark:text-slate-200">{poweredBy}</span>
        </p>
        {openHref && (
          <a href={openHref} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-2xs font-semibold text-link-600 dark:text-link-400 hover:underline">
            Open ↗
          </a>
        )}
      </div>
    </div>
  );
};

DeviceFrame.displayName = 'DeviceFrame';
