# Intégration par un agent IA de coding

Ce guide est destiné à un agent IA qui doit **ajouter la lecture rapide à une application hôte** (Vue 3, Angular ou JavaScript natif) à l'aide de ce module. Il est prescriptif : suivez les étapes dans l'ordre. Le contrat complet de l'API se trouve dans [api.md](api.md).

## 0. Ce que vous devez savoir avant d'écrire du code

- Le module **n'injecte aucun bouton**. C'est à vous d'ajouter un bouton « Lecture rapide » par section.
- Il **ne modifie jamais** le contenu de l'hôte. Il monte un élément `<urr-reader>` dans `document.body` pendant l'ouverture, puis le retire.
- Il n'a besoin d'**aucune dépendance npm**, d'aucun schéma de composant, d'aucun CSS global ni d'aucun accès réseau.
- Créez **une instance** de lecteur par page ou par service, réutilisée pour toutes les sections. Détruisez-la au démontage.
- Le lecteur ne s'ouvre que **dans le navigateur**. Le module s'importe sans risque en rendu serveur (SSR), mais `open()` doit être appelé côté client.

## 1. Copier l'artefact

```bash
# depuis le dépôt Universal RSVP Reader
npm ci && npm run build
cp -R dist <app>/src/vendor/universal-rsvp-reader
node scripts/verify-copy.mjs <app>/src/vendor/universal-rsvp-reader   # doit afficher 0 erreur
```

Autre possibilité : téléchargez l'archive `universal-rsvp-reader-<version>.zip` de la [release GitHub](https://github.com/docvinum/RSVP_ORP/releases) et décompressez-la au même endroit.

L'import se fait toujours via le fichier `.js`, dont le `.d.ts` voisin fournit les types :

```ts
import { createReader, type Reader, type ReaderSource } from '<chemin>/vendor/universal-rsvp-reader/universal-rsvp-reader.js';
```

- Pour TypeScript strict, incluez `vendor/**/*.d.ts` dans le `tsconfig` si le dossier est hors de `src`.
- Avec Vite ou le builder Angular, aucune configuration n'est nécessaire.

## 2. Choisir la source

| Situation dans l'hôte | Source à transmettre |
| --- | --- |
| La section est déjà affichée | `{ type: 'dom', element }` (référence à l'élément racine de la section) |
| Le contenu est une chaîne HTML (CMS, API) | `{ type: 'html', html }` |
| Le contenu est du Markdown | `{ type: 'markdown', markdown }` |
| Texte brut | `{ type: 'text', text }` (une ligne vide sépare les paragraphes) |

- Préférez `dom` quand le contenu est visible : ce qui est masqué (`hidden`, `display:none`) et les éléments interactifs (boutons, champs, `nav`) sont exclus automatiquement, y compris votre propre bouton « Lecture rapide ».
- Pour exclure autre chose (publicité, encadrés), ajoutez `data-rsvp-ignore` sur l'élément concerné, ou passez `exclude: '.selecteur'` à `createReader` ou à `open`.
- Si la section est dans une autre langue que celle de la page, posez l'attribut `lang` sur la section ou passez `contentLocale: 'en'`.

## 3. Intégrer selon le framework

### JavaScript natif

```js
import { createReader } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js';

const reader = createReader();
document.querySelectorAll('[data-quick-read]').forEach((button) => {
  button.addEventListener('click', () => {
    const section = button.closest('section');
    reader.open({ type: 'dom', element: section }).catch((error) => console.warn(error.code));
  });
});
// Navigation SPA maison : appelez reader.close() au changement de vue, reader.destroy() à la sortie.
```

### Vue 3 (Composition API)

```ts
// composables/useRsvpReader.ts
import { onBeforeUnmount, shallowRef } from 'vue';
import { createReader, type Reader, type ReaderSource } from '@/vendor/universal-rsvp-reader/universal-rsvp-reader.js';

export function useRsvpReader() {
  const reader = shallowRef<Reader | null>(null);
  const get = () => (reader.value ??= createReader());   // création paresseuse, côté client uniquement
  onBeforeUnmount(() => reader.value?.destroy());         // changement de route, v-if…
  return { open: (source: ReaderSource) => get().open(source) };
}
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRsvpReader } from '@/composables/useRsvpReader';
const section = ref<HTMLElement | null>(null);
const { open } = useRsvpReader();
</script>

<template>
  <section ref="section">
    <h2>Titre</h2>
    <p>Contenu…</p>
    <button type="button" @click="open({ type: 'dom', element: section! })">Lecture rapide</button>
  </section>
</template>
```

- Utilisez `shallowRef` et non `ref` : le lecteur ne doit pas devenir un proxy réactif.
- Avec Nuxt, appelez `createReader` dans un gestionnaire d'événement ou dans `onMounted`.

### Angular (standalone, avec ou sans zone)

```ts
// rsvp-reader.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { createReader, type OpenOptions, type Reader, type ReaderSource } from '../vendor/universal-rsvp-reader/universal-rsvp-reader.js';

@Injectable({ providedIn: 'root' })
export class RsvpReaderService implements OnDestroy {
  private reader: Reader | null = null;
  open(source: ReaderSource, options?: OpenOptions) {
    return (this.reader ??= createReader()).open(source, options);
  }
  close() { this.reader?.close(); }
  ngOnDestroy() { this.reader?.destroy(); }
}
```

```ts
// dans le composant de la page
@Component({
  selector: 'app-article',
  template: `
    <section #content><h2>Titre</h2><p>Contenu…</p>
      <button type="button" (click)="read()">Lecture rapide</button>
    </section>`,
})
export class ArticleComponent implements OnDestroy {
  private readonly reader = inject(RsvpReaderService);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');
  read() { void this.reader.open({ type: 'dom', element: this.content().nativeElement }); }
  ngOnDestroy() { this.reader.close(); } // la section source disparaît avec la route
}
```

- Le lecteur crée son élément lui-même : **n'ajoutez pas** `CUSTOM_ELEMENTS_SCHEMA` et n'utilisez pas `<urr-reader>` dans les templates.
- Pour mettre à jour l'interface Angular depuis les événements du lecteur, utilisez des signals. Ils fonctionnent aussi en mode zoneless.
- Avec le SSR Angular, n'appelez `open()` que depuis un événement utilisateur ou `afterNextRender`.

## 4. Options courantes

```ts
createReader({
  uiLocale: 'fr',                                        // ou 'en'
  settings: { profile: 'comfort' },                      // profil initial voulu par l'hôte
  persistence: { enabled: true, storageKey: 'monapp:rsvp' }, // uniquement si le produit le demande
  exclude: '.ad, .related',
  resumeOnWordClick: false,
});
```

- **Persistance** : elle est désactivée par défaut. Ne l'activez que si l'humain l'a demandé. Pour stocker côté serveur, laissez-la désactivée, écoutez `settings-change`, puis sauvegardez `reader.getPreferences()` et rechargez-les avec `createReader({ preferences })`.
- **Libellés** : `labels: { dialogTitle: 'Lire vite' }` surcharge un libellé. Les clés sont typées par `Labels`.

## 5. Événements et erreurs

```ts
const off = reader.on('close', ({ reason }) => console.debug('lecteur fermé', reason));
reader.on('error', ({ error }) => { if (error.fatal) showToast(error.message); });
```

- `open()` est rejeté avec une `ReaderError` dont le `code` vaut `INVALID_SOURCE`, `EMPTY_CONTENT`, `PARSE_ERROR`, `ENVIRONMENT`, `DESTROYED` ou `ABORTED` (ouverture remplacée par un appel plus récent : à ignorer). Gérez au moins `EMPTY_CONTENT` (section vide), par exemple en désactivant le bouton.
- Les erreurs `STORAGE` et `LISTENER` ne sont pas bloquantes (`fatal: false`).
- Désabonnez-vous avec la fonction retournée par `on()`. `destroy()` retire de toute façon tous les abonnés.

## 6. Liste de vérification de l'intégration

- [ ] Une instance par page ou service, avec `destroy()` au démontage (`onBeforeUnmount` ou `ngOnDestroy`) et `close()` au changement de route.
- [ ] Un bouton « Lecture rapide » natif (`<button type="button">`) par section, avec un texte explicite.
- [ ] La bonne section est transmise : vérifiez le titre du dialogue, qui reprend le premier titre de la section.
- [ ] Le contenu non pertinent est exclu (`data-rsvp-ignore` ou `exclude`).
- [ ] Aucun `CUSTOM_ELEMENTS_SCHEMA`, aucun CSS global et aucun import de police n'ont été ajoutés pour le lecteur.
- [ ] La persistance est désactivée, sauf demande explicite.
- [ ] Au clavier, Tab jusqu'au bouton puis Entrée ouvre le lecteur ; Espace lance la lecture ; Échap ferme et rend le focus au bouton.
- [ ] Sur mobile, le lecteur s'affiche en plein écran et la page hôte n'a pas défilé après la fermeture.

## 7. Tests à ajouter côté hôte (Playwright)

```ts
test('lecture rapide', async ({ page }) => {
  await page.goto('/article');
  const trigger = page.getByRole('button', { name: 'Lecture rapide' }).first();
  await trigger.click();
  await expect(page.locator('urr-reader dialog')).toBeVisible();          // le Shadow DOM est traversé
  await expect(page.locator('urr-reader .fulltext')).toContainText('…');  // le bon contenu
  await page.keyboard.press('Escape');
  await expect(page.locator('urr-reader')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
```

- Pour l'état interne, exposez l'instance en développement (`window.__reader = reader`) et lisez `reader.getState()`.

## 8. Ce qu'il ne faut pas faire

- Ne pas recréer un lecteur à chaque clic, sauf si vous appelez `destroy()` sur le précédent.
- Ne pas manipuler le DOM interne de `<urr-reader>` ni dépendre de ses classes CSS internes : elles ne font pas partie de l'API, à l'exception des sélecteurs de test listés plus haut.
- Ne pas modifier les fichiers copiés dans `vendor/`. Une évolution se fait dans le dépôt du module, puis la copie est refaite ([local-update.md](local-update.md)).
- Ne pas transmettre de HTML pré-assaini en pensant le protéger : le module n'affiche jamais de HTML, seulement du texte.
- Ne pas appeler `open()` en rendu serveur.
