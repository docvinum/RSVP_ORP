# Mise à jour locale des artefacts copiés

La bibliothèque n'est pas publiée sur npm. Les applications hôtes embarquent une **copie** du dossier `dist/`.

## Procédure

1. Dans ce dépôt, à la version voulue (tag ou branche) :

   ```bash
   npm ci
   npm run build        # régénère dist/ (sortie reproductible)
   ```

2. Remplacez **tout** le dossier copié dans l'application hôte, sans fusionner les fichiers :

   ```bash
   rm -rf <app>/src/vendor/universal-rsvp-reader
   cp -R dist <app>/src/vendor/universal-rsvp-reader
   ```

3. Vérifiez la copie : version et empreintes SHA-256 de chaque fichier.

   ```bash
   node scripts/verify-copy.mjs <app>/src/vendor/universal-rsvp-reader
   ```

4. Consultez le [CHANGELOG](../CHANGELOG.md), en particulier la section « Changements incompatibles », puis lancez les tests de l'application.

## Bonnes pratiques

- Commitez la copie dans l'application hôte : le build ne dépend alors d'aucun registre.
- N'éditez jamais les fichiers copiés. Une correction se fait dans ce dépôt, puis se recopie.
- `manifest.json` indique la version embarquée (`version`) ; `VERSION` est aussi exporté par le module.
- Le schéma des préférences est versionné (`version: 1`). Une version de bibliothèque qui le change inclura une migration ; des préférences d'une version inconnue sont ignorées sans erreur.
- Les démonstrateurs de ce dépôt suivent cette même procédure : `npm run sync:examples` copie `dist/` dans `examples/*/vendor/`.
