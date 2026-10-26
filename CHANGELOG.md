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
- Documentation pour agents IA de coding : `AGENTS.md` (contribution au dépôt), `CLAUDE.md`, `docs/ai-integration.md` (intégration dans une application hôte) et `llms.txt`.
- Workflow de publication (`.github/workflows/release.yml`) : vérifications, build reproductible, archives `.zip`/`.tar.gz` de `dist/` et empreintes SHA-256 jointes à la release.

### Corrigé (audit avant publication)
- Réentrance : un abonné qui met en pause, repositionne, relance ou détruit le moteur pendant une notification ne laisse plus de minuterie orpheline ni d'événement périmé.
- Cycle de vie : rouvrir un lecteur depuis son événement `close` pendant l'ouverture d'un autre ne laisse plus deux modales ; `destroy()` ou `close()` appelés pendant une ouverture la rendent caduque (`ABORTED`) sans état partiel.
- Ouverture transactionnelle : un nom de composant déjà pris ou un échec de `showModal()` ramènent à l'état fermé, avec une `ReaderError` et l'événement `error`.
- Événements de focus : un `close()` depuis un gestionnaire `focusin` pendant `showModal()` annule l'ouverture ; rouvrir le lecteur depuis le focus restauré à la fermeture n'est plus défait par la fin de cette fermeture (ordre `close` puis `open`).
- Remplacement d'un lecteur : `B.close()` appelé depuis l'événement `close` de A pendant `B.open()` annule bien l'ouverture de B.
- Toute vitesse fournie dans un patch, même égale à la vitesse stockée, arrête l'accélération en cours (y compris combinée à des pauses).
- `startAt` non fini ou décimal : premier mot ou index tronqué, comme `seek()`.
- Markdown : le HTML inline conserve les frontières de mots (`<br>`) et exclut scripts et éléments masqués.
- Construction du modèle linéaire (une ponctuation massive prenait plusieurs secondes).
- Les segments de mots longs respectent toujours la borne de 16 lettres.
- Constantes exportées gelées en profondeur.
- Serveur de démonstration : écoute locale, confinement réel à la racine, réponse 400 aux URL mal encodées.
- Workflow de publication : refuse un tag `vX.Y.Z` existant qui ne désigne pas le commit construit.

[1.0.0]: https://github.com/docvinum/RSVP_ORP/releases/tag/v1.0.0
