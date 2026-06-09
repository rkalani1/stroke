async function main() {
  try {
    console.log('Fetching live app.js...');
    const res = await fetch('https://rkalani1.github.io/stroke/app.js?cb=' + Date.now());
    const text = await res.text();
    console.log('Live app.js size:', text.length);
    
    const targetString1 = 'Primary Composite (Ischemic stroke, major bleeding, or death at 90d)';
    const targetString2 = '87% of recurrent strokes occurred in the first 30 days';
    const targetString3 = 'Initiate anticoagulation for days 1';
    
    console.log('Contains Kaufmann composite endpoint details:', text.includes(targetString1));
    console.log('Contains STOP-CAD temporal risk:', text.includes(targetString2));
    console.log('Contains transition strategy rationale:', text.includes(targetString3));
  } catch (err) {
    console.error(err);
  }
}

main();
