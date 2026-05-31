import React from 'react';

export const TimeWindowRing = ({ timeFromLKW, onNavigate }) => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Circle dimensions
  const radius = 45;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~282.74

  if (!timeFromLKW) {
    // Welcoming inactive state: Neutral dotted ring
    return (
      <div 
        onClick={() => onNavigate?.('encounter')}
        className="group relative flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-cobalt-50/20 hover:border-cobalt-300 dark:border-slate-800 dark:bg-slate-950/20 dark:hover:bg-cobalt-950/10 dark:hover:border-cobalt-700 transition-all duration-200"
        style={{ width: '140px', height: '140px' }}
        role="button"
        tabIndex={0}
        aria-label="Start acute stroke encounter"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate?.('encounter'); }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="var(--line-2)"
            strokeWidth={2}
            strokeDasharray="4, 4"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <i data-lucide="plus" className="w-4 h-4 text-slate-400 group-hover:text-cobalt-500 mb-1 transition-colors"></i>
          <span className="font-mono text-2xs uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 font-semibold">Start Case</span>
          <span className="text-[10px] text-slate-400 mt-0.5 leading-none">No active patient</span>
        </div>
      </div>
    );
  }

  // Active state calculations
  const elapsedHours = timeFromLKW.total || 0;
  const elapsedStr = `${timeFromLKW.hours}h ${timeFromLKW.minutes}m`;
  
  let label = 'Acute Window';
  let progress = 0;
  let ringColor = 'var(--teal)';
  let bgWash = 'var(--teal-wash)';
  let textColor = 'var(--tag-teal)';
  let urgentPulse = false;

  if (elapsedHours <= 4.5) {
    // Thrombolysis (IVT) window
    progress = Math.min(1.0, elapsedHours / 4.5);
    label = 'IVT window';
    if (elapsedHours <= 3.0) {
      ringColor = 'var(--okc)';
      bgWash = 'var(--ok-wash)';
      textColor = 'var(--tag-ok)';
    } else {
      ringColor = 'var(--gold)';
      bgWash = 'var(--gold-wash)';
      textColor = 'var(--tag-gold)';
      urgentPulse = true; // approaching 4.5h breach
    }
  } else if (elapsedHours <= 24.0) {
    // Endovascular (EVT) window
    progress = Math.min(1.0, (elapsedHours - 4.5) / 19.5);
    label = 'EVT window';
    ringColor = 'var(--teal)';
    bgWash = 'var(--teal-wash)';
    textColor = 'var(--tag-teal)';
  } else {
    // Outside standard 24h window
    progress = 1.0;
    label = 'Outside 24h';
    ringColor = 'var(--coral)';
    bgWash = 'var(--coral-wash)';
    textColor = 'var(--tag-coral)';
  }

  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div 
      className="relative flex flex-col items-center justify-center p-3 rounded-xl border border-line bg-card shadow-sm"
      style={{ width: '140px', height: '140px' }}
      role="timer"
      aria-label={`Stroke window position: ${label}, elapsed ${elapsedStr}`}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Track circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="var(--panel-2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            transformOrigin: '50% 50%',
          }}
        />
        {/* Urgent indicator blinking dot if motion is allowed */}
        {urgentPulse && !prefersReduced && (
          <circle
            cx={50 + radius * Math.cos((progress * 2 * Math.PI) - Math.PI / 2)}
            cy={50 + radius * Math.sin((progress * 2 * Math.PI) - Math.PI / 2)}
            r={3}
            fill="var(--surface)"
            className="animate-ping"
            style={{ transformOrigin: '50% 50%' }}
          />
        )}
      </svg>
      {/* Centered label overlays */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1 select-none">
        <span className="font-mono text-2xs uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400 leading-none mb-1">
          {timeFromLKW.label || 'Elapsed'}
        </span>
        <span className="text-sm font-bold font-mono tabular-nums leading-none text-slate-900 dark:text-slate-100">
          {elapsedStr}
        </span>
        <span 
          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1.5 leading-none transition-colors duration-300"
          style={{ backgroundColor: bgWash, color: textColor }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

TimeWindowRing.displayName = 'TimeWindowRing';
