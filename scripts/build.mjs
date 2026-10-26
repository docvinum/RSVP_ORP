// Build de distribution : ESM autonome (dépendances embarquées) + déclarations TypeScript.
import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const dist = join(root, 'dist');
const banner = `/*! Universal RSVP Reader v${pkg.version} | MIT | inclut markdown-it (MIT) */`;

rmSync(dist, { recursive: true, force: true });

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  define: { __URR_VERSION__: JSON.stringify(pkg.version) },
  build: {
    outDir: dist,
    emptyOutDir: false,
    target: 'es2022',
    minify: 'oxc',
    sourcemap: true,
    lib: {
      entry: join(root, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'universal-rsvp-reader.js',
    },
    rolldownOptions: {
      output: { banner },
    },
  },
});

execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '-p', join(root, 'tsconfig.build.json')], { stdio: 'inherit' });
writeFileSync(join(dist, 'universal-rsvp-reader.d.ts'), `${banner}\nexport * from './types/index';\n`);

// Manifeste : version et empreintes, pour vérifier une copie locale.
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
walk(dist);
const manifest = {
  name: pkg.name,
  version: pkg.version,
  entry: 'universal-rsvp-reader.js',
  types: 'universal-rsvp-reader.d.ts',
  files: Object.fromEntries(
    files.map((f) => [relative(dist, f).split('\\').join('/'), createHash('sha256').update(readFileSync(f)).digest('hex')]),
  ),
};
writeFileSync(join(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const size = statSync(join(dist, 'universal-rsvp-reader.js')).size;
console.log(`dist/universal-rsvp-reader.js v${pkg.version} — ${(size / 1024).toFixed(1)} Ko`);
