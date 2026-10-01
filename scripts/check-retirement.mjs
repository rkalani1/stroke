import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const retired = ['documents','src/education.jsx','src/teaching.jsx','src/teaching.js','src/simulators','src/views','src/reference-loader.js','src/deferred-reference-data.js','src/components/TrialScreener.jsx','src/components/EligibilityTables.jsx','scripts/generate-pdfs.mjs','scripts/build-content-bundle.mjs'];
const failures = retired.filter(file => fs.existsSync(path.join(root,file))).map(file => `Retired module/asset remains: ${file}`);
const manifest = JSON.parse(fs.readFileSync(path.join(root,'app-assets.json')));
const graph = manifest.files.map(file => fs.readFileSync(path.join(root,file.path),'utf8')).join('\n');
for (const text of ['Education Gallery','TrialScreener','EvdIcpSimulator','PupillometrySimulator','Generate teaching PDF','OpenAI API','API Key','afib_timing_protocol.png']) if (graph.includes(text)) failures.push(`Retired interface shipped: ${text}`);
for (const dir of ['chunks', 'assets']) {
  const walk = folder => fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? walk(path.join(folder,entry.name)) : [path.relative(root,path.join(folder,entry.name)).split(path.sep).join('/')]);
  for (const file of walk(path.join(root,dir))) {
    if (dir === 'chunks' && !manifest.files.some(record => file === record.path || file === record.path+'.gz' || file === record.path+'.br')) failures.push(`Stale generated module: ${file}`);
    if (dir === 'assets' && !/^assets\/(fonts|splash)\//.test(file)) failures.push(`Teaching asset outside allowlist: ${file}`);
  }
}
for (const name of ['index.html','service-worker.js','manifest.json','llms.txt','llms-full.txt']) {
  const text = fs.readFileSync(path.join(root,name),'utf8');
  if (/documents\/|#\/trials/.test(text) && name !== 'service-worker.js' && name !== 'llms.txt' && name !== 'llms-full.txt') failures.push(`Retired route/download advertised in ${name}`);
}
for (const file of fs.readdirSync(path.join(root,'data/guidelines'))) {
  const item = JSON.parse(fs.readFileSync(path.join(root,'data/guidelines',file)));
  if (item.data !== null || item._meta?.status !== 'retired') failures.push(`Old guideline endpoint is not explicitly retired: ${file}`);
}
if (failures.length) { failures.forEach(f => console.error(f)); process.exitCode=1; }
else console.log('Retirement guard PASS: modules/assets absent; complete generated graph and old JSON routes checked.');
