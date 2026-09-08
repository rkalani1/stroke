export function packGuideline(guideline) {
  if (!Array.isArray(guideline.recommendations)) throw new Error('Guideline recommendations must be an array');
  const { recommendations, ...metadata } = guideline;
  const schemas = [];
  const schemaIndexes = new Map();
  const rows = recommendations.map(recommendation => {
    const keys = Object.keys(recommendation);
    const signature = JSON.stringify(keys);
    if (!schemaIndexes.has(signature)) {
      schemaIndexes.set(signature, schemas.length);
      schemas.push(keys);
    }
    return [schemaIndexes.get(signature), ...keys.map(key => recommendation[key])];
  });
  return { metadata, schemas, rows };
}
