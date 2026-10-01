import React, { useState } from 'react';
import SupplementaryCalculators from './components/SupplementaryCalculators.jsx';
import { calculatorDefinitions } from './supplementary-calculator-definitions.js';
import { ENCOUNTER_TOOLS, matchesCalculatorSearch } from './calculator-utilities.js';

export default function Tools({ state, update, tool, mapUrl }) {
  const [search, setSearch] = useState({ tool, value:'' });
  // Reset before the new deep-link target is focused, including back navigation.
  if (search.tool !== tool) setSearch({ tool, value:'' });
  const query = search.tool === tool ? search.value : '';
  const setQuery = value => setSearch({ tool, value });
  const encounterTools = ENCOUNTER_TOOLS.filter(item => matchesCalculatorSearch(item, query));
  const resultCount = encounterTools.length + calculatorDefinitions.filter(item => matchesCalculatorSearch(item, query)).length;
  return <section className="tools-surface"><h1>Calculators & Links</h1>
    {tool && <p><a className="workspace-secondary-action" href="#/tools">All calculators</a></p>}
    <div className="calculator-search"><label className="workspace-field"><span>Find a calculator</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or abbreviation" /></label>
      {query && <button type="button" className="workspace-secondary-action" onClick={() => setQuery('')}>Clear search</button>}
    </div>
    {query.trim() && <p role="status" className="workspace-help">{resultCount ? `${resultCount} calculator${resultCount === 1 ? '' : 's'} found.` : 'No calculators found. Try a name or abbreviation, or clear the search.'}</p>}
    <div hidden={!encounterTools.length}><h2>Encounter calculators</h2>
      <ul className="tool-links">{ENCOUNTER_TOOLS.map(item => <li key={item.id} hidden={!matchesCalculatorSearch(item, query)}><a href={`#/encounter/${item.id}`}>{item.name}</a></li>)}</ul>
    </div>
    <SupplementaryCalculators state={state} update={update} tool={tool} query={query} />
    <h2>External references</h2><ul>
      <li><a href={mapUrl} target="_blank" rel="noopener noreferrer">Telestroke Map</a></li>
      <li><a href="https://www.uptodate.com/" target="_blank" rel="noopener noreferrer">UpToDate</a></li>
      <li><a href="https://www.openevidence.com/" target="_blank" rel="noopener noreferrer">OpenEvidence</a></li>
    </ul>
  </section>;
}
