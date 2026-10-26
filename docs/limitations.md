# Limitations connues (v1.0.0)

## Contenu et langue
- **Segmentation de repli** : sans `Intl.Segmenter` (Firefox < 125, anciens navigateurs), un repli par expressions régulières Unicode est utilisé. Il gère accents, marques combinantes, séquences ZWJ et drapeaux, mais n'applique pas toutes les règles UAX #29. Les deux stratégies sont testées et produisent les mêmes résultats sur les cas courants, en français et en anglais.
- **Détection des phrases** : elle est heuristique (liste d'abréviations françaises et anglaises, initiales, sigles pointés, casse du mot suivant). Des cas ambigus, comme une abréviation en fin de phrase suivie d'une majuscule, peuvent ne pas couper la phrase.
- **Écritures sans espaces** (chinois, japonais, thaï) : le découpage repose sur `Intl.Segmenter` ; le repli ne découpe pas ces textes en mots. Le texte de droite à gauche (arabe, hébreu) n'a pas été validé visuellement.
- **Mots très longs** : au-delà de 25 lettres, le découpage en segments est arithmétique (de préférence aux traits d'union), sans césure linguistique.
- **Code** : les blocs de code sont lus comme du texte et leurs espaces sont normalisées ; l'indentation n'est pas conservée dans le texte intégral.
- **Contenu ignoré** : images (y compris leur texte alternatif), formules (MathML), contenu des racines fantômes (Shadow DOM) de l'hôte et des iframes.
- **Source DOM** : la visibilité est évaluée avec `getComputedStyle` (`display`, `visibility`). Un contenu masqué par d'autres techniques (`clip`, hors écran, opacité nulle) est lu.

## Interface
- Une seule modale ouverte à la fois par page (choix de conception, voir architecture.md).
- Le clic sur un mot du texte intégral est réservé au pointeur et au toucher. Au clavier, on se repositionne avec les commandes, le curseur de progression et les raccourcis.
- Pas de séparateur redimensionnable entre la zone RSVP et le texte intégral.
- Le temps restant est estimé à la vitesse nominale, sans tenir compte des pauses.
- Le thème suit `prefers-color-scheme`, ou un choix explicite ; il n'existe pas de thème personnalisable par variables CSS publiques.
- Libellés intégrés en français et en anglais seulement (surcharge possible via `labels`).

## Environnement
- Navigateurs : `<dialog>`/`showModal()`, les Custom Elements et le Shadow DOM sont requis (Safari 15.4 ou plus récent). Sans eux, `open()` est rejeté avec `ENVIRONMENT`.
- Les tests E2E et visuels ne s'exécutent que sur **Chromium** (desktop et émulation Pixel 7). Firefox et WebKit n'ont pas été testés automatiquement.
- **Régression visuelle** : les captures de référence dépendent des polices de la machine qui les a générées. Le job CI correspondant n'est pas bloquant ; regénérez les références sur votre environnement de référence avec `npm run test:visual:update`. L'alignement ORP, lui, est vérifié géométriquement (au pixel) dans les tests E2E bloquants.
- **Démonstrateur Angular** : Angular 22 exige Node ≥ 22.22.3 ou ≥ 24.15. La bibliothèque seule fonctionne avec Node ≥ 20.
- Le build n'est pas minifié en espaces (les noms sont raccourcis) : environ 200 Ko, soit environ 70 Ko compressé, dont une large part pour markdown-it et sa table d’entités HTML.
