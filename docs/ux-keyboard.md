# Guide UX et raccourcis clavier

## Principes

- **Sobriété** : une seule zone dominante, celle du mot RSVP. Les commandes sont groupées sous la barre de progression et les réglages avancés sont rangés dans un panneau à part.
- **Aucune surprise pour l'hôte** : le lecteur n'injecte aucun bouton ni style global. Il ne modifie pas le contenu source et rend le focus et la position de défilement à la fermeture.
- **Contrôle explicite** : rien ne démarre seul, sauf avec `autoPlay`. Un clic dans le texte repositionne la lecture sans la relancer.

## Disposition desktop

Modale centrée, d'au plus 980 × 780 px :

1. **En-tête** : titre (premier titre du contenu, ou titre fourni), bouton **Réglages**, bouton **Fermer**.
2. **Zone RSVP** : le mot courant, avec sa lettre ORP en couleur et en gras, centrée sur un axe fixe placé à 38 % de la largeur. Les repères de fixation sont deux traits verticaux et deux lignes, et peuvent être masqués.
3. **Progression** : position « 12 / 340 », un curseur pour repositionner et le temps restant estimé (à la vitesse nominale).
4. **Commandes** : phrase précédente, mot précédent, **Lecture / Pause**, mot suivant, phrase suivante, puis vitesse − / + (pas de 25). La mention « accélération » s'affiche pendant une montée en vitesse.
5. **Texte intégral** : le mot courant est surligné et la phrase active teintée. Un clic sur un mot repositionne la lecture, qui reste en pause, et le focus revient sur **Lecture**.
6. **Réglages** : une colonne de 360 px à droite. La zone RSVP reste visible et les changements s'appliquent immédiatement.

## Disposition mobile (≤ 640 px de large)

Plein écran, disposition verticale : la zone RSVP en haut, puis la progression et les commandes tactiles (cibles d'au moins 44 × 44 px), puis le texte intégral, qui occupe tout l'espace restant. Le panneau de réglages s'ouvre comme un panneau inférieur dédié, sous la zone RSVP, qui reste visible. Il n'y a pas de séparateur redimensionnable en version 1.

## Vue partagée

- La synchronisation repose sur les index stables du modèle normalisé (`data-w`, `data-s`).
- **Suivi automatique** : la vue ne défile que lorsque le mot courant sort de la bande de confort (de 15 % à 70 % de la hauteur visible). Elle replace alors le mot vers le quart supérieur, ce qui évite un défilement à chaque mot.
- **Défilement manuel** : molette, toucher, touches de défilement dans la zone ou clic sur sa barre de défilement suspendent le suivi. Le bouton **Reprendre le suivi** apparaît alors ; un clic sur un mot réactive aussi le suivi.
- Avec `prefers-reduced-motion: reduce`, le défilement est immédiat, sans animation.

## Raccourcis clavier

Les raccourcis ne sont actifs que lorsque le lecteur est ouvert : ils sont écoutés sur le dialogue, jamais sur la page.

| Touche | Action | Inactif quand le focus est sur… |
| --- | --- | --- |
| `Espace` | Lecture / pause | un bouton, un champ, une liste, un lien ou le texte intégral (comportement natif conservé) |
| `K` | Lecture / pause | un champ de saisie |
| `←` / `→` | Mot précédent / suivant | un champ (dont le curseur de progression, qui avance d'un mot) ou le panneau de réglages |
| `Maj` + `←` / `→` | Phrase précédente / suivante | idem |
| `↑` / `↓` | Vitesse + 25 / − 25 | un champ, le texte intégral, le panneau de réglages |
| `+` / `-` | Vitesse + 25 / − 25 | un champ de saisie |
| `Début` / `Fin` | Premier / dernier mot | un champ, le texte intégral, le panneau de réglages |
| `Échap` | Ferme le panneau de réglages s'il est ouvert, sinon le lecteur | — |
| `Tab` / `Maj` + `Tab` | Parcourt les commandes (le focus reste dans la modale) | — |

Les raccourcis combinés avec `Ctrl`, `Cmd` ou `Alt` sont ignorés, afin de laisser les raccourcis du navigateur intacts.

## Accessibilité (WCAG 2.2 AA visé)

- Dialogue modal natif (`<dialog>` avec `showModal()`) : le reste de la page devient inerte, la modale est nommée par son titre (`aria-labelledby`) et le focus est placé sur **Lecture** à l'ouverture, puis restauré à la fermeture lorsque c'est possible.
- Toutes les commandes portent un nom accessible et une infobulle. Le curseur de progression expose « Mot 12 sur 340 » (`aria-valuetext`).
- **Pas d'annonce mot à mot** : le mot RSVP est `aria-hidden`. Une seule région `aria-live="polite"` annonce les changements d'état (lecture, pause avec la position, fin).
- Le texte intégral est une région nommée « Texte intégral », focalisable et lisible par les technologies d'assistance. Le mot courant porte `aria-current`.
- Contrastes : la palette claire et la palette sombre respectent le ratio de 4,5:1. La lettre ORP respecte au moins 3:1 (texte gras de grande taille). Une couleur choisie trop peu contrastée est ajustée automatiquement, avec un message.
- Prise en charge de `prefers-reduced-motion` et de `forced-colors`.
- Les tests automatisés couvrent axe-core (WCAG 2.0 à 2.2 A/AA) en thème clair et sombre, avec les réglages ouverts.

## Personnalisation visuelle

| Réglage | Valeurs |
| --- | --- |
| Couleur ORP | Rouge par défaut (`#d32f2f`), quatre couleurs proposées, couleur libre (`#rrggbb`), avec contraste garanti |
| Taille | 24 à 96 px (pas de 2). Les mots longs sont réduits jusqu'à 16 px au minimum. |
| Police | Sans empattement, avec empattement, chasse fixe, haute lisibilité (polices système uniquement, sans téléchargement) |
| Repères de fixation | Affichés ou masqués |
| Thème | Système, clair, sombre |
