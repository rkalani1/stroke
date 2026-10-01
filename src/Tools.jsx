import React from 'react';
import SupplementaryCalculators from './components/SupplementaryCalculators.jsx';

const ENCOUNTER_TOOLS = [['nihss', 'NIHSS'], ['crcl', 'Renal calculation'], ['tnk', 'Lytic dose'], ['ich-volume', 'ICH volume'], ['ich-score', 'ICH severity'], ['gcs', 'GCS'], ['dawn', 'Historical source screens'], ['dapt', 'Acute DAPT source screen']];
export default function Tools({ state, update, tool, mapUrl }) {
  return <section className="tools-surface"><h1>Calculators & Links</h1>
    {tool && <p><a className="workspace-secondary-action" href="#/tools">All calculators</a></p>}
    <h2>Encounter calculators</h2>
    <ul className="tool-links">{ENCOUNTER_TOOLS.map(([id, label]) => <li key={id}><a href={`#/encounter/${id}`}>{label}</a></li>)}</ul>
    <SupplementaryCalculators state={state} update={update} tool={tool} />
    <h2>External references</h2><ul>
      <li><a href={mapUrl} target="_blank" rel="noopener noreferrer">Telestroke Map</a></li>
      <li><a href="https://www.uptodate.com/" target="_blank" rel="noopener noreferrer">UpToDate</a></li>
      <li><a href="https://www.openevidence.com/" target="_blank" rel="noopener noreferrer">OpenEvidence</a></li>
    </ul>
  </section>;
}
