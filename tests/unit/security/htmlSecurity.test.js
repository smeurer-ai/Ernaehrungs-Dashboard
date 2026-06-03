import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync('ernaehrung.html', 'utf8');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../');

describe('HTML security headers', () => {
  it('loads fonts from local assets instead of Google Fonts', () => {
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).not.toContain('fonts.gstatic.com');
    expect(html).toContain('href="./assets/fonts/fonts.css"');
  });

  it('defines a strict CSP without any CDN origins', () => {
    const match = html.match(
      /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/
    );
    expect(match?.[1]).toBeTruthy();
    expect(match[1]).toContain("default-src 'self'");
    expect(match[1]).toContain("script-src 'self'");
    expect(match[1]).toContain("font-src 'self'");
    expect(match[1]).not.toContain('fonts.googleapis.com');
    expect(match[1]).not.toContain('fonts.gstatic.com');
    expect(match[1]).not.toContain('https://esm.sh');
    expect(match[1]).not.toContain('https://cdn.jsdelivr.net');
  });
});

// ── CDN-Blocklist ─────────────────────────────────────────────────────────────
// Scannt ausschließlich Produktionsdateien.
// Ausgeschlossen: node_modules/, tests/, docs/, scripts/, package-lock.json, alle Nicht-Quelltext-Dateien.

const CDN_BLOCKLIST = ['esm.sh', 'cdn.jsdelivr.net'];

// Nur diese Verzeichnisse/Dateien werden gescannt — alles andere bleibt außen vor.
const PRODUCTION_TARGETS = [
  'ernaehrung.html',
  'service-worker.js',
  'manifest.json',
  'js',
  'assets',
];

function collectProductionFiles(root, targets) {
  const result = [];
  function walk(p) {
    const stat = statSync(p);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(p)) walk(join(p, entry));
    } else {
      result.push(p);
    }
  }
  for (const target of targets) {
    const full = join(root, target);
    try { walk(full); } catch { /* existiert noch nicht, z.B. assets/vendor vor Task 3 */ }
  }
  return result;
}

const productionFiles = collectProductionFiles(ROOT, PRODUCTION_TARGETS)
  .filter(f => /\.(html|js|json|css)$/.test(f));

describe('CDN-Blocklist', () => {
  for (const cdn of CDN_BLOCKLIST) {
    it(`enthält kein '${cdn}' in Produktionsdateien`, () => {
      const violations = productionFiles.filter(f =>
        readFileSync(f, 'utf-8').includes(cdn)
      );
      expect(violations, `CDN-Fundstellen:\n${violations.join('\n')}`).toEqual([]);
    });
  }
});
