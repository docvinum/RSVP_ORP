# Démonstrateurs

Les trois applications consomment **uniquement** l'artefact compilé `dist/`, copié dans `vendor/universal-rsvp-reader/` par `npm run sync:examples` (exécuté automatiquement avant `dev`/`build`/`start`).

| Démo | Lancer | Points montrés |
| --- | --- | --- |
| `vanilla/` | à la racine : `npm run build && npm run sync:examples && npm run serve`, puis <http://localhost:4173/examples/vanilla/> | Module ESM importé directement |
| `vue/` | `npm install && npm run dev` | Composable `useRsvpReader()`, destruction au démontage |
| `angular/` | `npm install && npm start` (Node ≥ 22.22.3 ou ≥ 24.15) | Service injectable, routeur, `ngOnDestroy`, mode zoneless |

Chaque démo présente quatre sections, chacune avec son bouton « Lecture rapide » (DOM, HTML, Markdown, texte anglais), les profils et réglages avancés, la vue partagée, un journal des événements, la destruction et la recréation du lecteur, le changement de route (Articles ↔ À propos) et la persistance locale activable.
