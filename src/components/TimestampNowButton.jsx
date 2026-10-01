import React from 'react';

export default function TimestampNowButton({ label, hasValue, onUseNow }) {
  return <button type="button" className="workspace-secondary-action timestamp-shortcut" aria-label={`Set ${label} to now`} onClick={() => {
    if (hasValue && !window.confirm(`Replace the recorded ${label} with the current local date and time?`)) return;
    onUseNow(Date.now());
  }}>Set {label} to now</button>;
}
