/**
 * PostCSS pipeline for `npm run build:css` (tailwindcss --postcss <this file>).
 *
 * Identical to the Tailwind CLI's built-in pipeline (postcss-import →
 * tailwindcss → autoprefixer → cssnano when --minify) except for one step:
 * src/design/shell.css is NOT inlined before Tailwind runs. It is appended
 * to the very end of the output after Tailwind has finished.
 *
 * Why: Tailwind treats every class selector in its input as an @apply
 * candidate. shell.css (the former inline <style> of index.html) is full of
 * compound selectors such as `#main .border.border-line.rounded-md` and
 * `.flex.gap-2 > button`; fed through Tailwind, every `@apply border …` in
 * src/styles.css (.app-shell, .v6-btn-*, .ref-section-icon, …) would splice
 * copies of those rules onto its own selector. Appending afterwards also
 * reproduces the cascade position the block had as an inline <style> that
 * loaded after the tailwind.css <link>: after every Tailwind layer and after
 * the unlayered tail of styles.css.
 */
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const tailwindcss = require('tailwindcss');

const SHELL_IMPORT = /(^|\/)shell\.css$/;

const appendShellLast = () => ({
  postcssPlugin: 'stroke-append-shell-css',
  Once(root, { result }) {
    root.walkAtRules('import', (rule) => {
      const uri = rule.params.replace(/^url\(\s*/, '').replace(/\s*\)$/, '').replace(/^['"]|['"]$/g, '');
      if (!SHELL_IMPORT.test(uri)) return;
      const from = rule.source && rule.source.input && rule.source.input.file;
      const file = path.resolve(from ? path.dirname(from) : process.cwd(), uri);
      rule.remove();
      const shell = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
      root.append(shell.nodes);
      result.messages.push({ type: 'dependency', plugin: 'stroke-append-shell-css', file, parent: from });
    });
  }
});
appendShellLast.postcss = true;

module.exports = {
  plugins: [
    // Leave the shell import untouched (postcss-import hoists it to the top
    // as a plain @import, which Tailwind ignores); appendShellLast moves the
    // file's contents to the end once Tailwind is done.
    postcssImport({ filter: (uri) => !SHELL_IMPORT.test(uri) }),
    tailwindcss,
    appendShellLast
  ]
};
