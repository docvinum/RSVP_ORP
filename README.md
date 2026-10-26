# Universal RSVP Reader

Universal RSVP Reader est une bibliothèque autonome de **lecture rapide RSVP** (*Rapid Serial Visual Presentation*) avec mise en évidence du **point de reconnaissance optimal (ORP)**. Elle se compose d'un Web Component natif et d'une API JavaScript typée. Elle s'intègre à une application **Vue 3**, **Angular** ou **JavaScript natif** sans dépendre d'aucun de ces frameworks.

- Quatre sources : texte brut, HTML (analyse inerte), Markdown et élément DOM (lecture seule).
- Affichage mot par mot. La lettre ORP reste centrée sur un axe fixe, avec des pauses adaptatives déterministes.
- Une vue du texte intégral reste synchronisée : mot courant, phrase active, clic pour repositionner, suivi automatique suspendu en cas de défilement manuel.
- Quatre profils (Confort, Standard, Rapide, Personnalisé), des réglages de pauses à trois niveaux plus un mode détaillé, et une accélération progressive optionnelle.
- Modale centrée sur desktop, plein écran sur mobile, accessible au clavier (WCAG 2.2 AA visé).
- Aucun appel réseau, aucun style global, aucune modification du DOM hôte. La persistance des préférences est désactivée par défaut.

> Version **1.0.0** — voir [CHANGELOG.md](CHANGELOG.md).

## Installation (sans npm)

Le livrable est le dossier [`dist/`](dist/) : un module ESM autonome, avec markdown-it embarqué et les déclarations TypeScript.

```
dist/
├── universal-rsvp-reader.js       # module ESM (≈ 200 Ko, ≈ 70 Ko gzip)
├── universal-rsvp-reader.js.map
├── universal-rsvp-reader.d.ts     # point d'entrée des types
├── types/                         # déclarations détaillées
└── manifest.json                  # version et empreintes SHA-256
```

1. Copiez `dist/` dans votre projet, par exemple sous `src/vendor/universal-rsvp-reader/`.
2. Importez le module : `import { createReader } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js'`.

Rien d'autre n'est à installer : ni framework, ni parseur. Pour mettre à jour la copie, suivez le [guide de mise à jour locale](docs/local-update.md).

## Démarrage rapide

```html
<section id="article">
  <h2>Mon article</h2>
  <p>Un texte à lire rapidement…</p>
  <button type="button" id="quick-read">Lecture rapide</button>
</section>

<script type="module">
  import { createReader } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js';

  const reader = createReader(); // une instance, réutilisable pour plusieurs sections
  document.getElementById('quick-read').addEventListener('click', () => {
    reader.open({ type: 'dom', element: document.getElementById('article') });
  });
</script>
```

Le bouton déclencheur est fourni par votre application : le module n'injecte jamais de bouton dans la page. Les éléments interactifs, dont ce bouton, sont exclus du texte lu.

### Vue 3

```ts
import { onBeforeUnmount } from 'vue';
import { createReader } from '@/vendor/universal-rsvp-reader/universal-rsvp-reader.js';

const reader = createReader();
onBeforeUnmount(() => reader.destroy()); // libère tout au démontage (changement de route…)

function quickRead(el: HTMLElement) {
  reader.open({ type: 'dom', element: el });
}
```

### Angular

```ts
@Injectable({ providedIn: 'root' })
export class RsvpReaderService implements OnDestroy {
  private readonly reader = createReader();
  open(source: ReaderSource) { return this.reader.open(source); }
  close() { this.reader.close(); }
  ngOnDestroy() { this.reader.destroy(); }
}
```

Le lecteur crée lui-même son élément `<urr-reader>` : aucun `CUSTOM_ELEMENTS_SCHEMA` n'est nécessaire. Des intégrations complètes sont disponibles dans [`examples/`](examples/).

## Documentation

| Document | Contenu |
| --- | --- |
| [docs/api.md](docs/api.md) | API publique : options, sources, méthodes, événements, états, erreurs, préférences |
| [docs/ux-keyboard.md](docs/ux-keyboard.md) | Guide UX, dispositions desktop et mobile, raccourcis clavier, accessibilité |
| [docs/profiles-and-timing.md](docs/profiles-and-timing.md) | Profils, coefficients de timing, accélération, algorithme ORP |
| [docs/architecture.md](docs/architecture.md) | Modules, flux de données et décisions de conception |
| [docs/local-update.md](docs/local-update.md) | Mise à jour des artefacts copiés |
| [docs/limitations.md](docs/limitations.md) | Limitations connues |
| [CHANGELOG.md](CHANGELOG.md) | Historique des versions |

## Démonstrateurs

| Démo | Dossier | Lancer |
| --- | --- | --- |
| JavaScript natif | `examples/vanilla` | `npm run build && npm run sync:examples && npm run serve`, puis <http://localhost:4173/examples/vanilla/> |
| Vue 3 + Vite | `examples/vue` | `cd examples/vue && npm install && npm run dev` |
| Angular 22 | `examples/angular` | `cd examples/angular && npm install && npm start` (Node ≥ 22.22.3 ou ≥ 24.15) |

Les trois démos consomment exclusivement l'artefact `dist/`, copié dans `vendor/` par `npm run sync:examples`. Elles présentent quatre sections (une par format), les profils et réglages avancés, la vue partagée, un journal des événements, la destruction et la recréation du lecteur, le changement de route et la persistance optionnelle.

## Développement

Prérequis : Node ≥ 20 pour la bibliothèque. Node 24 est recommandé, car la démo Angular 22 l'exige.

```bash
npm install
npm run typecheck        # TypeScript strict
npm run lint             # ESLint
npm test                 # Vitest (unitaires)
npm run build            # dist/ (ESM + .d.ts + manifeste)
npm run examples:install && npm run examples:build
npm run test:e2e         # Playwright : desktop, mobile, intégration des démos
npm run test:visual      # régression visuelle (captures de référence)
```

Navigateurs pris en charge : les deux dernières versions de Chrome, Edge, Firefox et Safari, ainsi que iOS Safari 15.4 et versions ultérieures (`<dialog>` est requis).

## Licence

MIT. Le build inclut [markdown-it](https://github.com/markdown-it/markdown-it) (MIT).
