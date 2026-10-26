# Changelog

Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/). Versionnage : [SemVer](https://semver.org/lang/fr/).

## [1.0.0] — 2026-10-26

Première version.

### Ajouté
- Moteur RSVP indépendant du DOM : machine à états, horloge monotone, compensation de dérive, recalage sans rafale après suspension, navigation par mot et par phrase.
- ORP déterministe en graphèmes Unicode, centré sur un axe fixe. Réduction des mots longs (plancher de 16 px) et découpage des mots de plus de 25 lettres.
- Timing adaptatif centralisé : virgule, point-virgule ou deux-points, fin de phrase, fin de paragraphe, mots longs. Trois niveaux et un mode détaillé, avec des valeurs bornées.
- Profils Confort, Standard, Rapide et Personnalisé (profils prédéfinis immuables).
- Accélération progressive optionnelle (linéaire ou douce), suspendue avec la lecture.
- Sources texte, HTML (analyse inerte), Markdown (markdown-it embarqué) et DOM (lecture seule), réunies dans un modèle normalisé commun à index stables.
- Web Component `<urr-reader>` en Shadow DOM : modale desktop, plein écran mobile, vue du texte intégral synchronisée, panneau de réglages, personnalisation visuelle, thèmes clair et sombre.
- Accessibilité : dialogue modal, gestion et restauration du focus, raccourcis clavier, annonces d'état sans annonce mot à mot, contraste ORP garanti, prise en charge de `prefers-reduced-motion` et de `forced-colors`.
- API `createReader()` : événements typés, état, position, réglages, préférences versionnées, persistance optionnelle (désactivée par défaut), erreurs typées.
- Build ESM autonome avec déclarations TypeScript et manifeste d'empreintes ; script de vérification de copie.
- Démonstrateurs JavaScript natif, Vue 3 et Angular 22.
- Tests Vitest (unitaires), Playwright (desktop, mobile, intégration, accessibilité axe, régression visuelle) et CI GitHub Actions.

[1.0.0]: https://github.com/docvinum/RSVP_ORP/releases/tag/v1.0.0
