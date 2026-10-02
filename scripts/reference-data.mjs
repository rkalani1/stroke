import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculatorDefinitions } from '../src/supplementary-calculator-definitions.js';

// One projection for generation, validation and tests. The historical source
// crosswalk carries bibliographic/access context, never old recommendations.
export function readClinicalReference(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const directory = path.join(root, 'src/reference');
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, `${name}.json`), 'utf8'));
  const topics = ['acute-topics', 'clinic-topics', ...fs.readdirSync(directory).filter(name => /^expanded-.*\.json$/.test(name)).sort().map(name => name.slice(0, -5))].flatMap(read);
  const coverage = ['coverage', 'study-sources'].flatMap(name => fs.existsSync(path.join(directory, `${name}.json`)) ? read(name) : []);
  for (const entry of coverage) for (const topicId of entry.topicIds) {
    const topic = topics.find(record => record.id === topicId);
    if (!topic) throw Error(`Unknown coverage topic ${topicId} for ${entry.id}`);
    if (!topic.sources.some(source => source.url === entry.url)) {
      const { id, topicIds, ...source } = entry;
      topic.sources.push(source);
    }
  }
  return { topics, studies: read('studies'), calculators: calculatorDefinitions };
}
