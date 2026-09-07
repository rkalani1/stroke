// A lossless build representation: recommendation column names are stored once
// per schema instead of repeated thousands of times in the offline app bundle.
// Canonical JSON files and their public data projections stay human-readable.
export function unpackGuideline({ metadata, schemas, rows }) {
  return {
    ...metadata,
    recommendations: rows.map(([schema, ...values]) =>
      Object.fromEntries(schemas[schema].map((key, index) => [key, values[index]])))
  };
}
