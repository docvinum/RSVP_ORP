# Architecture

```
src/
├── core/      Moteur RSVP et logique pure, sans DOM ni navigateur
│   ├── model.ts          Représentation intermédiaire (blocs, phrases, tokens, mots, index stables)
│   ├── segmentation.ts   Intl.Segmenter + repli regex Unicode
│   ├── normalize.ts      Normalisation du texte (NFC, espaces, invisibles)
│   ├── document.ts       Blocs bruts → modèle normalisé (phrases, abréviations, mots longs)
│   ├── orp.ts            Calcul ORP (graphèmes)
│   ├── timing.ts         Durée d'un mot (coefficients centralisés)
│   ├── acceleration.ts   Vitesse en fonction du temps de lecture
│   ├── settings.ts       Types, profils, bornes, validation, application des modifications
│   ├── engine.ts         Machine à états et planification (horloge et minuterie injectables)
│   ├── emitter.ts        Émetteur typé
│   ├── color.ts          Contraste WCAG
│   └── errors.ts         ReaderError
├── parsers/   Extraction : texte, HTML (DOMParser, jamais inséré), Markdown (markdown-it), DOM (lecture seule)
├── ui/        Web Component <urr-reader> (Shadow DOM), vue intégrale, panneau de réglages, styles
├── api/       Façade createReader(), événements publics, préférences
└── index.ts   Exports publics
```

## Flux

```
ReaderSource ──parsers──▶ RawBlock[] ──core/document──▶ NormalizedDocument
                                                        │
createReader() ──▶ ReaderImpl ──possède──▶ RsvpEngine (unique) ◀──actions── <urr-reader>
                        │                        │                              ▲
                        │                        └──événements internes─────────┤ rendu
                        └──événements publics (on/off/once)                     │
                        └──réglages validés ──▶ engine.configure + element.applySettings
```

- **Une seule instance de moteur par lecteur.** Le composant reçoit le moteur et un objet `ReaderViewHost` ; il n'en crée jamais. Les actions de l'interface (réglages, vitesse, clic sur un mot, fermeture) passent par le même chemin que l'API (source `user` au lieu de `api`), ce qui évite toute duplication de logique.
- Le moteur n'utilise ni le DOM ni `window`. L'horloge (`performance.now`) et la minuterie (`setTimeout`) sont injectables, ce qui rend les tests déterministes (`tests/unit/fake-time.ts`).
- Le module s'importe sans DOM : la classe du Web Component est créée à la demande.

## Décisions de conception

| Sujet | Décision | Motif |
| --- | --- | --- |
| Vitesse et profil | Le réglage de vitesse ne fait pas basculer vers Personnalisé | La vitesse est le réglage le plus fréquent ; basculer à chaque pression de « + » rendrait les profils inutilisables |
| Vitesse pendant l'accélération | Un changement manuel arrête la montée | Le geste explicite de l'utilisateur l'emporte et le comportement reste prévisible |
| Instances simultanées | Une seule modale ouverte (la précédente est fermée avec `superseded`) | Deux dialogues modaux concurrents ne sont pas accessibles |
| Onglet masqué | Pause automatique, sans reprise automatique | Évite de « lire » dans le vide et de surprendre l'utilisateur au retour |
| Markdown | markdown-it embarqué, modèle construit depuis les tokens, jamais rendu | Parseur mature ; pas de HTML intermédiaire, donc pas de risque d'injection |
| HTML | DOMParser (document sans contexte de navigation) | Aucun script exécuté ; pas de chargement de ressources dans les navigateurs actuels (non garanti par la spécification) ; HTML inline du Markdown traité avec les mêmes exclusions |
| Réentrance | État complet avant notification ; numéro d'opération pour `open` ; `ABORTED` pour une ouverture caduque | Événements synchrones (contrat public inchangé) tout en tolérant tout appel depuis un abonné |
| Ouverture | Transactionnelle (retour à l'état fermé en cas d'échec) | Pas d'élément monté ni de document chargé après un échec |
| Rendu du texte intégral | Nœuds texte uniquement, depuis le modèle | Aucun HTML source réinjecté |
| Styles | Shadow DOM, `adoptedStyleSheets`, `:host { all: initial }` | Aucun style global ; insensible aux styles de l'hôte |
| Défilement de l'hôte | Molette et toucher bloqués hors des zones défilantes du lecteur pendant l'ouverture, position restaurée à la fermeture | Préserve la position de lecture dans la page |
| Clic sur un mot | Repositionne et met en pause, puis rend le focus à Lecture | Le geste suivant naturel est « Espace » |
| Mots très longs | Découpés au-delà de 25 lettres (segments ≤ 16) | Rester lisible sur 360 px sans casser l'axe ORP |
| Langue de l'interface | Français par défaut, anglais intégré, libellés surchargeables | Public cible francophone, sans dépendance i18n |

## Dépendances

- Runtime : **markdown-it** (MIT), embarqué dans le build. C'est la seule dépendance, et elle est justifiée par l'exigence d'un parseur Markdown mature.
- Développement : TypeScript, Vite (build), Vitest, jsdom, Playwright, axe-core, ESLint.
