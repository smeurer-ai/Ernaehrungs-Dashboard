// scripts/vendor.js
// Ausführen mit: npm run vendor
// Nur bei Versions-Updates der Bibliotheken erneut ausführen.

import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';

const outDir = 'assets/vendor';
mkdirSync(outDir, { recursive: true });

const base = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  minify: false,
};

// React + ReactDOM gemeinsam – beide teilen intern dieselbe React-Instanz.
await esbuild.build({
  ...base,
  stdin: {
    contents: `
export { default } from 'react';
export { createRoot } from 'react-dom/client';
`,
    resolveDir: '.',
  },
  outfile: `${outDir}/react.js`,
});
console.log('✓ assets/vendor/react.js');

// htm – Template-Tag-Bibliothek für JSX-ähnliche Syntax.
await esbuild.build({
  ...base,
  stdin: {
    contents: `export { default } from 'htm';`,
    resolveDir: '.',
  },
  outfile: `${outDir}/htm.js`,
});
console.log('✓ assets/vendor/htm.js');

// idb – IndexedDB-Wrapper.
await esbuild.build({
  ...base,
  stdin: {
    contents: `export { openDB } from 'idb';`,
    resolveDir: '.',
  },
  outfile: `${outDir}/idb.js`,
});
console.log('✓ assets/vendor/idb.js');

console.log('\nAlle Vendor-Dateien in assets/vendor/ erstellt.');
