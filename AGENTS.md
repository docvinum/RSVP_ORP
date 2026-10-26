# AGENTS.md — Guide pour agents IA de coding

Ce fichier s'adresse aux agents IA (Claude Code, Codex, Copilot, Cursor…) qui **modifient ce dépôt**.

Pour **intégrer** la bibliothèque dans une application Vue, Angular ou JavaScript, lisez [docs/ai-integration.md](docs/ai-integration.md).

## 1. Le projet en 30 secondes

Universal RSVP Reader est une bibliothèque TypeScript de lecture rapide RSVP/ORP. Elle se compose d'un Web Component `<urr-reader>` (Shadow DOM) et d'une façade `createReader()`. Elle n'a pas de framework UI et une seule dépendance runtime : markdown-it, embarquée dans le build. Le livrable est le dossier `dist/`, **commité**, que les applications hôtes copient sans passer par npm.

| Dossier | Rôle | Peut utiliser le DOM ? |
| --- | --- | --- |
| `src/core/` | Modèle, segmentation, ORP, timing, réglages, moteur, émetteur, erreurs | **Non** (pas de `document`, `window`, `HTMLElement`) |
| `src/parsers/` | Texte, HTML, Markdown, DOM vers `RawBlock[]`, puis `parseSource()` | Oui, en **lecture seule** |
| `src/ui/` | Web Component, vue intégrale, panneau de réglages, styles, libellés | Oui, uniquement dans son Shadow DOM |
| `src/api/` | `createReader()`, événements publics, préférences | Oui (cycle de vie, focus, visibilité) |
| `src/index.ts` | **Seule** surface publique (exports) | — |
| `dist/` | Artefact généré par `npm run build`, **commité** | — |
| `examples/` | Démos native, Vue 3 et Angular 22 consommant `vendor/` (copie de `dist/`) | — |
| `tests/unit/` | Vitest (environnement node ; `// @vitest-environment jsdom` si besoin) | — |
| `tests/e2e/` | Playwright : `reader/` (desktop et mobile), `integration/` (démos), `visual/` | — |
| `docs/` | Documentation utilisateur (en français) | — |

## 2. Commandes

```bash
npm install                 # dépendances (Node ≥ 20 ; Node 24 recommandé)
npm run typecheck           # tsc strict, sans émission
npm run lint                # ESLint (typescript-eslint)
npm test                    # Vitest — rapide, à lancer après chaque modification
npm run build               # régénère dist/ (sortie reproductible, à commiter)
npm run sync:examples       # copie dist/ vers examples/*/vendor/
npm run test:e2e            # Playwright desktop + mobile + intégration (démos construites requises)
npm run test:visual         # captures de référence ; --update-snapshots via test:visual:update
npm run check               # typecheck + lint + test + build
```

Pour les tests d'intégration, construisez d'abord les démos :

```bash
npm run examples:install && npm run examples:build
```

- La CLI Angular 22 exige **Node ≥ 22.22.3 ou ≥ 24.15**. Avec un Node plus ancien, lancez `npx -y node@24 examples/angular/node_modules/@angular/cli/bin/ng.js build --base-href ./` depuis `examples/angular`.
- Chromium est la seule cible E2E. `@playwright/test` est épinglé en **1.63.0**, la version des navigateurs préinstallés : ne le mettez pas à jour sans raison.
- Le serveur de test (`scripts/serve.mjs`, port 4173) est lancé automatiquement par Playwright.

## 3. Invariants à ne jamais casser

Chacun est couvert par des tests. Si un test échoue, corrigez le code ; n'affaiblissez pas le test.

1. **`src/core` est pur.** Aucun accès au DOM ni au navigateur. L'horloge et la minuterie sont injectées (`Clock`, `Timer`) et les tests utilisent `tests/unit/fake-time.ts`.
2. **Un seul moteur par lecteur.** `ReaderImpl` (api) possède l'unique `RsvpEngine`. Le Web Component le reçoit via `ReaderViewHost` et n'en crée jamais. Les actions de l'interface passent par le même chemin que l'API (source `'user'` au lieu de `'api'`).
3. **Aucune mutation du DOM source.** Les parseurs lisent seulement : `childNodes`, `nodeValue`, `getAttribute`, `matches`, `getComputedStyle`.
4. **Aucun HTML non fiable inséré.** Dans `src/ui`, créez les éléments avec `h()` (`src/ui/dom.ts`) et des nœuds texte. Jamais de `innerHTML`, `outerHTML`, `insertAdjacentHTML` ni `document.write`. Le HTML passe par `DOMParser`, qui ne s'exécute pas. Le Markdown n'est jamais rendu en HTML : le modèle est construit à partir des tokens de markdown-it.
5. **Aucun style global.** Les styles vivent dans `src/ui/styles.ts`, sont adoptés dans le Shadow DOM, et `:host { all: initial }` les isole. N'ajoutez rien dans `document.head`.
6. **Aucune fuite.** Tout écouteur ou observateur est lié à un `AbortSignal` (`buildAbort` pour la construction, `openAbort` pour l'ouverture) ou explicitement retiré. Il y a au plus une minuterie active par moteur. `close()` et `destroy()` sont idempotents.
7. **Aucun appel réseau.** Pas de `fetch`, `XMLHttpRequest` ni `import()` dynamique distant, et pas de police web : uniquement des polices système (`FONT_STACKS`).
8. **Persistance désactivée par défaut.** Rien n'est écrit dans `localStorage` sans `persistence.enabled`. Les préférences ne contiennent que des réglages, jamais de texte, de position ni d'historique.
9. **Module importable sans DOM (SSR).** `HTMLElement` n'est lu qu'à l'ouverture : la classe est créée dans `getElementClass()`. N'écrivez pas de `class X extends HTMLElement` au niveau du module.
10. **Index stables.** Le modèle (`buildDocument`) est déterministe. La vue intégrale et le moteur se synchronisent uniquement par `Word.index` et `Sentence.index` (`data-w`, `data-s`).
11. **Réglages toujours validés.** Toute entrée (options, préférences, formulaire, API) passe par `normalizeSettings` ou `applySettingsPatch` (`src/core/settings.ts`). Les constantes de profils et de niveaux sont gelées (`Object.freeze`).
12. **Alignement ORP.** Le centre de la lettre ORP est sur l'axe, à 1 px près. Le calcul pur se trouve dans `src/ui/orp-layout.ts` et le rendu est vérifié par `tests/e2e/reader/orp.spec.ts`. Un changement de CSS de `.stage` ou `.word` exige de relancer ce test.

## 4. Règles de produit (décisions validées)

Ne les modifiez pas sans demander à l'humain.

- La vitesse se règle de 150 à 900 mots/minute, par pas de 25, avec 250 par défaut. **Changer la vitesse ne bascule jamais vers Personnalisé.** Une modification effective des pauses ou de l'accélération bascule vers Personnalisé.
- Profils : Confort (200, pauses fortes), Standard (250, normales), Rapide (400, faibles). L'accélération est désactivée dans tous les profils prédéfinis.
- Un changement manuel de vitesse **arrête** l'accélération en cours.
- Une seule modale ouverte à la fois : ouvrir un lecteur B ferme A, qui émet `close` avec la raison `'superseded'`.
- L'onglet masqué met en pause (`pause` avec la raison `'hidden'`) ; la lecture ne reprend pas automatiquement.
- Un clic sur un mot repositionne la lecture et la met en pause (sauf `resumeOnWordClick`), puis rend le focus au bouton Lecture.
- Les mots de plus de 25 lettres sont découpés en segments de 16 lettres au plus (`Word.continues`). La police n'est jamais réduite sous 16 px.
- La couleur ORP par défaut est `#d32f2f`, avec un contraste minimal de 3:1 garanti par `ensureContrast`.
- L'interface est en français par défaut, avec l'anglais intégré (`src/ui/labels.ts`).

Toute nouvelle décision affectant fortement l'UX ou l'architecture **se valide avec l'humain avant implémentation**. Les ambiguïtés mineures se tranchent par la solution la plus simple, documentée ensuite.

## 5. Conventions de code

- TypeScript **strict**, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` : utilisez `import type` pour les types (ESLint l'impose).
- Commentaires, JSDoc, messages d'erreur et documentation **en français**. Les identifiants restent en anglais.
- La densité de commentaires suit celle du code existant : un bloc JSDoc par module ou fonction publique pour expliquer le *pourquoi*, sans paraphraser le code.
- **Caractères Unicode** : jamais de caractère invisible littéral (espace insécable, ZWJ, marque combinante) dans les sources. Utilisez la forme `\u{A0}`, `\u{202F}`, `\u{200D}` ; les expressions régulières qui la contiennent portent le drapeau `u`. Les caractères visibles (« », é, —, emoji) restent littéraux.
- Les erreurs publiques sont des `ReaderError` avec un code de `ReaderErrorCode`. Un nouveau code se documente dans `src/core/errors.ts` et `docs/api.md`.
- Les exports publics sont ajoutés **uniquement** via `src/index.ts`. Ce qui n'y figure pas reste interne. `@internal` est retiré des déclarations (`stripInternal`).
- Pas de nouvelle dépendance runtime sans justification écrite et accord de l'humain. Les dépendances de développement restent raisonnables.
- Aucun backend, aucune IA, aucune télémétrie, aucun service externe. Hors périmètre : PDF, EPUB, extensions de navigateur, comptes.

## 6. Recettes

### Ajouter un réglage

1. Dans `src/core/settings.ts` : déclarez le type, la valeur par défaut, les bornes (`NumberBounds`), la normalisation (`normalize*`) et l'application dans `applySettingsPatch`. Décidez s'il fait basculer le profil.
2. Dans `src/ui/settings-panel.ts` : ajoutez le champ via les aides (`numberField`, `select`, `checkbox`…), puis gérez-le dans `handleChange` et `update`.
3. Ajoutez les libellés FR et EN dans `src/ui/labels.ts`.
4. Appliquez-le dans `ReaderElement.applySettings` (variables CSS) ou dans `engine.configure`.
5. Tests : `tests/unit/settings.test.ts` (bornes, bascule de profil) et un test E2E dans `tests/e2e/reader/reader.spec.ts` (effet immédiat).
6. Docs : `docs/profiles-and-timing.md` ou `docs/ux-keyboard.md`. Le schéma des préférences reste en **version 1** tant que l'ajout est rétrocompatible : un champ absent prend sa valeur par défaut.

### Ajouter un type de source

Ajoutez le parseur dans `src/parsers/<type>.ts` (sortie `RawBlock[]`), la branche dans `sourceToBlocks`, le type dans `ReaderSource`, des tests dans `tests/unit/parsers.test.ts` (y compris l'équivalence avec les autres formats) et la documentation dans `docs/api.md`. Le périmètre est limité à texte, HTML, Markdown et DOM : demandez avant d'en ajouter un autre.

### Ajouter un raccourci clavier

Modifiez `onKeyDown` dans `src/ui/reader-element.ts`. Respectez les garde-fous (`inText`, `inFullText`, `inPanel`, modificateurs ignorés). Mettez à jour `shortcutList` (FR et EN), `docs/ux-keyboard.md`, et ajoutez un test E2E.

### Modifier le timing ou l'ORP

`src/core/timing.ts` et `src/core/orp.ts` sont des fonctions pures et déterministes. Mettez à jour `tests/unit/timing-orp.test.ts`, `docs/profiles-and-timing.md`, puis relancez `orp.spec.ts` et les captures visuelles.

### Modifier l'interface

Relancez `npm run test:e2e`, puis `npm run test:visual`. Si le changement visuel est voulu, regénérez les captures avec `npm run test:visual:update`, puis **regardez les PNG** de `tests/e2e/visual/__screenshots__/` avant de les commiter. Vérifiez l'accessibilité avec `tests/e2e/reader/a11y.spec.ts` (axe-core, WCAG 2.2 AA).

### Publier une version

1. Sur une branche : incrémentez `version` dans `package.json` (SemVer), renommez la section « Non publié » du `CHANGELOG.md` en `## [x.y.z] — AAAA-MM-JJ` et ajoutez le lien en bas du fichier. Lancez `npm run build` et commitez `dist/` (la bannière et le manifeste portent la version).
2. Vérifiez les notes : `node scripts/release-notes.mjs x.y.z`.
3. Après fusion dans `main`, déclenchez le workflow **Release** (`workflow_dispatch`, entrée `version` = `x.y.z`). Poussez un tag `vx.y.z` si vous préférez ce déclencheur. Le workflow vérifie la version, rejoue les contrôles, contrôle que `dist/` est à jour, puis crée le tag, la release, les archives `.zip`/`.tar.gz` et `SHA256SUMS.txt`.
4. Ne recréez jamais une release existante : le workflow échoue si le tag a déjà une release.

## 7. Définition de « terminé »

Avant de proposer un commit ou une PR :

- [ ] `npm run typecheck && npm run lint && npm test` sont verts.
- [ ] `npm run build` a été lancé et `dist/` est **commité** (la CI échoue si `git diff -- dist` n'est pas vide).
- [ ] `npm run sync:examples && npm run examples:build && npm run test:e2e` sont verts si l'UI, l'API ou le build sont touchés.
- [ ] Les captures visuelles sont à jour et ont été relues si le rendu change.
- [ ] La documentation est à jour : `docs/*.md`, `README.md`, et `CHANGELOG.md` (section « Non publié » ou nouvelle version SemVer).
- [ ] Pour un changement d'API publique : `docs/api.md` et `docs/ai-integration.md` sont à jour, et la version est incrémentée dans `package.json`.
- [ ] Aucun invariant de la section 3 n'est cassé.

La CI (`.github/workflows/ci.yml`, Node 24) rejoue tout cela. Le job `visual` n'est pas bloquant, car il dépend des polices du runner.

## 8. Pièges connus

- `jsdom` n'implémente pas `HTMLDialogElement.showModal`. L'ouverture du lecteur se teste donc dans Playwright, pas dans Vitest. En Node, `open()` est rejeté avec `ENVIRONMENT`, et c'est voulu.
- Les sélecteurs Playwright traversent le Shadow DOM ouvert : `page.locator('urr-reader .word')`.
- `getByRole('button', { name: 'Réglages' })` correspond à plusieurs boutons : ajoutez `exact: true`.
- Sur mobile, le panneau de réglages recouvre les commandes : fermez-le (`Escape`) avant de cliquer sur Lecture.
- `Intl.Segmenter` et le repli regex doivent donner le même résultat. Les tests de `document.test.ts` tournent avec les deux stratégies (`describe.each`).
- Le build Vite en mode bibliothèque ne minifie pas les espaces, et c'est voulu : la sortie reste lisible et reproductible. N'activez pas de minification non déterministe.
- `examples/*/vendor/` et `examples/*/dist/` sont ignorés par git : ils se régénèrent.
