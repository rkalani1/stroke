// Browser global search needs only labels, keywords and navigation identifiers.
// This generated projection avoids loading a second full copy of the records.
import entries from '../content/search-index.json';
import { copyContentSearchEntries } from './content-search-projection.js';

export function getBrowserSearchIndex() {
  return copyContentSearchEntries(entries);
}
