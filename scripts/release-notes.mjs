// Génère les notes de release d'une version à partir de CHANGELOG.md.
// Usage : node scripts/release-notes.mjs <version>   (ex. 1.0.0)
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const version = process.argv[2];
const repo = `https://github.com/${process.env.GITHUB_REPOSITORY ?? 'docvinum/RSVP_ORP'}/blob/v${version}`;
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage : node scripts/release-notes.mjs <version>  (ex. 1.0.0)');
  process.exit(2);
}

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*\\n`, 'm');
const match = heading.exec(changelog);
if (!match) {
  console.error(`Section « ## [${version}] » absente de CHANGELOG.md.`);
  process.exit(1);
}
const rest = changelog.slice(match.index + match[0].length);
const end = rest.search(/^## \[|^\[[^\]]+\]: /m);
const section = (end < 0 ? rest : rest.slice(0, end)).trim();

process.stdout.write(`${section}

## Installation

Téléchargez l'archive \`universal-rsvp-reader-${version}.zip\` (ou \`.tar.gz\`) ci-dessous, puis copiez son contenu dans votre application, par exemple sous \`src/vendor/universal-rsvp-reader/\` :

\`\`\`js
import { createReader } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js';
\`\`\`

Aucune dépendance à installer : markdown-it est embarqué. Les empreintes SHA-256 de chaque fichier figurent dans \`manifest.json\`, et celles des archives dans \`SHA256SUMS.txt\`.

Documentation : [README](${repo}/README.md) · [API](${repo}/docs/api.md) · [Intégration par un agent IA](${repo}/docs/ai-integration.md) · [Mise à jour locale](${repo}/docs/local-update.md) · [Limitations](${repo}/docs/limitations.md)
`);
