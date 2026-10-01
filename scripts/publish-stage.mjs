import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'output/site');
const rootFiles = ['index.html','app.js','app-assets.json','tailwind.css','service-worker.js','offline.html','manifest.json','icon-192.png','icon-512.png','llms.txt','llms-full.txt','robots.txt','sitemap.xml','404.html'];
const directories = ['chunks', 'assets/fonts', 'assets/splash', 'data'];
const suffixes = ['', '.gz', '.br'];
export const PUBLIC_ROOTS = [...rootFiles, 'chunks', 'assets', 'data'];
await fs.rm(out, { recursive: true, force: true }); await fs.mkdir(out, { recursive: true });
for (const file of rootFiles) for (const suffix of suffixes) {
  try { await fs.copyFile(path.join(root,file+suffix), path.join(out,file+suffix)); }
  catch (error) { if (error.code !== 'ENOENT' || !suffix) throw error; }
}
for (const dir of directories) {
  await fs.mkdir(path.dirname(path.join(out,dir)), { recursive: true });
  await fs.cp(path.join(root,dir),path.join(out,dir),{recursive:true});
}
// Pages remains a branch-root Jekyll deployment. Generate a deterministic
// exclusion list so that its effective output has the same public roots as
// this explicit stage. New support roots must never become public implicitly.
const entries = (await fs.readdir(root)).filter(name => !name.startsWith('.') && name !== '_config.yml' && !PUBLIC_ROOTS.includes(name) && !rootFiles.some(file => name === file+'.gz' || name === file+'.br')).sort();
const config = '# Generated public-output exclusions. See scripts/publish-stage.mjs.\nexclude:\n' + ['.claude/', '.discovery/', '.githooks/', '.github/', '.agents/', '.remember/', 'private/', ...await Promise.all(entries.map(async name => name + ((await fs.stat(path.join(root,name))).isDirectory() ? '/' : '')))].map(name => '  - '+name).join('\n')+'\n';
await fs.writeFile(path.join(root,'_config.yml'), config);
console.log('Allowlisted public artifact staged at output/site; branch-root exclusions generated.');
