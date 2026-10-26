# API publique

```ts
import { createReader, type Reader } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js';

const reader: Reader = createReader(options);

await reader.open({ type: 'dom', element: document.querySelector('#article')! });
reader.play();
reader.pause();
reader.resume();
reader.seek(42);
reader.setSpeed(350);
reader.close();
reader.destroy();
```

Toutes les déclarations sont fournies dans `universal-rsvp-reader.d.ts`.

## `createReader(options?)`

Cette fonction crée un lecteur. Chaque lecteur possède **un seul moteur** et **un seul composant d'interface**, créé à la première ouverture puis réutilisé. Le Web Component ne crée jamais de moteur : il reçoit celui du lecteur.

| Option | Type | Défaut | Rôle |
| --- | --- | --- | --- |
| `settings` | `SettingsPatch` | — | Réglages initiaux voulus par l'hôte |
| `preferences` | `Preferences \| string` | — | Préférences fournies par l'hôte (priorité sur le stockage local) |
| `persistence.enabled` | `boolean` | `false` | Active la persistance locale |
| `persistence.storageKey` | `string` | `'urr:prefs:v1'` | Clé de stockage |
| `persistence.storage` | `StorageLike` | `localStorage` | Stockage alternatif (`getItem`/`setItem`) |
| `uiLocale` | `'fr' \| 'en'` | `'fr'` | Langue de l'interface |
| `labels` | `Partial<Labels>` | — | Surcharge des libellés |
| `contentLocale` | `string` | `lang` du DOM, sinon `'fr'` | Langue du contenu (segmentation) |
| `exclude` | `string` (sélecteur CSS) | — | Contenus à ignorer (sources `html` et `dom`) |
| `container` | `HTMLElement` | `document.body` | Élément où monter `<urr-reader>` |
| `tagName` | `string` | `'urr-reader'` | Nom de l'élément personnalisé |
| `resumeOnWordClick` | `boolean` | `false` | Un clic sur un mot lance la lecture au lieu de la laisser en pause |
| `pauseWhenHidden` | `boolean` | `true` | Met en pause quand l'onglet devient invisible |
| `autoPlay` | `boolean` | `false` | Lance la lecture à l'ouverture |
| `restoreFocus` | `boolean` | `true` | Rend le focus à l'élément actif avant l'ouverture |

Les réglages initiaux sont résolus dans cet ordre : valeurs par défaut (profil Standard), puis `settings`, puis préférences. Les préférences sont celles fournies dans `preferences` ; à défaut, celles du stockage, si la persistance est activée.

## Sources

```ts
type ReaderSource =
  | { type: 'text'; text: string }          // une ligne vide sépare les paragraphes
  | { type: 'html'; html: string }          // DOMParser : aucun script exécuté, jamais inséré dans la page
  | { type: 'markdown'; markdown: string }  // markdown-it (CommonMark + tableaux), jamais rendu en HTML
  | { type: 'dom'; element: HTMLElement };  // lecture seule, aucun nœud ni attribut modifié
```

Sont exclus du texte : `script`, `style`, `template`, `iframe`, les médias (`img`, `video`, `svg`…), les contrôles de formulaire (`button`, `input`, `select`, `textarea`, `label`), `nav`, `dialog`, ainsi que les éléments `hidden`, `inert`, `aria-hidden="true"` ou `data-rsvp-ignore`. Sont également exclus les rôles interactifs (`button`, `toolbar`, `navigation`…), les éléments non affichés (`display:none`, `visibility:hidden`, pour la source `dom`) et ce qui correspond à `exclude`. L'élément racine transmis est toujours lu, même s'il est masqué.

La vue du texte intégral est reconstruite à partir du modèle normalisé, en nœuds texte uniquement. Le HTML source n'est jamais inséré dans le lecteur.

## `open(source, options?)`

```ts
open(source: ReaderSource, options?: {
  title?: string;         // défaut : premier titre du contenu, sinon « Lecture rapide »
  startAt?: number;       // index du mot de départ (tronqué et borné ; non fini → 0)
  autoPlay?: boolean;
  contentLocale?: string;
  exclude?: string;
}): Promise<void>
```

- La promesse est résolue une fois le dialogue affiché, à l'état `ready`.
- Elle est rejetée avec une `ReaderError` (codes `INVALID_SOURCE`, `EMPTY_CONTENT`, `PARSE_ERROR`, `ENVIRONMENT`, `DESTROYED`, `ABORTED`). L'événement `error` est émis lui aussi.
- **Ouverture transactionnelle** : en cas d'échec (composant impossible à créer, `showModal()` refusé…), le lecteur revient à l'état fermé, sans élément monté ni document chargé, et une `ReaderError` est toujours rejetée — jamais une exception brute.
- **Appel répété pendant l'ouverture** : la lecture en cours est mise en pause (événement `pause`, raison `api`), puis le contenu est remplacé. Le dialogue reste ouvert, le focus d'origine est conservé et `open` est émis de nouveau.
- **Réentrance** : les événements sont synchrones et les abonnés peuvent appeler toute méthode, y compris pendant une ouverture (par exemple depuis `progress`). Un `open()`, `close()` ou `destroy()` ultérieur rend l'ouverture en cours caduque : elle est rejetée avec `ABORTED` et l'état final est celui de l'opération la plus récente. Une ouverture annulée avant d'aboutir n'émet ni `open` ni `close`. Les appels DOM susceptibles d'exécuter du code hôte (`showModal()`, `focus()`, `dialog.close()`, qui déclenchent des événements de focus) sont traités de la même façon : un `close()` appelé depuis un gestionnaire `focusin` annule l'ouverture en cours.
- **Ordre de fermeture** : l'état est nettoyé, puis `pause` (raison `close`) et `close` sont émis, et enfin le dialogue est retiré et le focus rendu à l'hôte. Un lecteur rouvert depuis un abonné à `close` ou depuis le focus restauré reste ouvert ; les événements suivent alors l'ordre `close` puis `open`.
- **Instances simultanées** : une seule modale est ouverte à la fois dans la page. Ouvrir un lecteur B pendant que A est ouvert ferme A, qui émet `close` avec la raison `superseded`.

## Commandes

Elles sont sans effet lorsque le lecteur est fermé ou détruit, sauf `setSpeed` et les méthodes de réglages.

| Méthode | Comportement |
| --- | --- |
| `play()` | Démarre ou reprend. Depuis `complete`, recommence au début (et réarme l'accélération). |
| `pause()` | Suspend la lecture. Sans effet hors lecture. |
| `resume()` | Reprend depuis `paused` ou `ready`. Sans effet depuis `complete`. |
| `toggle()` | Alterne lecture et pause. |
| `seek(index)` | Positionne sur un mot. L'index est borné et tronqué, et `NaN` est ignoré. L'état `playing` est conservé ; depuis `ready` ou `complete`, l'état devient `paused`. |
| `nextWord()` / `previousWord()` | Mot suivant ou précédent. |
| `nextSentence()` | Début de la phrase suivante, ou dernier mot s'il n'y en a pas. |
| `previousSentence()` | Début de la phrase courante, ou de la précédente si l'on est déjà au début. |
| `setSpeed(wpm)` | Vitesse bornée à [150, 900] et arrondie au pas de 25. Elle arrête une accélération en cours et ne change pas le profil. Retourne la vitesse appliquée. |
| `close()` | Ferme et restaure le focus et le défilement de l'hôte. Idempotent. |
| `destroy()` | Ferme, libère le moteur, le composant et les abonnés. Idempotent. Après destruction, `open()` est rejetée avec `DESTROYED` et les autres appels sont sans effet. |

Tous ces appels sont idempotents : appeler deux fois `play()` ou `pause()` ne crée ni minuterie supplémentaire ni événement en double.

## États

`getState()` retourne :

```ts
{
  status: 'closed' | 'ready' | 'playing' | 'paused' | 'complete' | 'destroyed';
  engineStatus: 'idle' | 'ready' | 'playing' | 'paused' | 'complete';
  isOpen: boolean;
  position: ReaderPosition | null;  // { index, total, progress, sentenceIndex, blockIndex, speed }
  speed: number;                   // vitesse nominale courante, accélération comprise
  accelerating: boolean;
  title: string | null;
}
```

Transitions du moteur :

```
idle ──load──▶ ready ──play──▶ playing ──pause──▶ paused ──resume/play──▶ playing
                 │                │
                 │                └──dernier mot──▶ complete ──play──▶ playing (depuis le début)
                 └──seek──▶ paused
close() / destroy() : retour à idle depuis n'importe quel état
```

`getPosition()`, `getDocument()` (modèle normalisé), `isOpen` et `isDestroyed` complètent l'API.

## Événements

```ts
const off = reader.on('progress', (p) => console.log(p.index, p.total));
off();                          // désabonnement
reader.off('progress', handler); // équivalent
reader.once('complete', handler);
```

| Événement | Charge utile | Émis |
| --- | --- | --- |
| `open` | `{ title, wordCount, sentenceCount, sourceType }` | Dialogue affiché (aussi lors d'une réouverture sur un autre contenu) |
| `play` | `ReaderPosition` | Passage à `playing` |
| `pause` | `ReaderPosition & { reason: 'user' \| 'api' \| 'hidden' \| 'close' }` | Passage de `playing` à `paused` |
| `progress` | `ReaderPosition` | À chaque changement de mot (lecture ou navigation) |
| `complete` | `ReaderPosition` | Dernier mot affiché pendant toute sa durée |
| `close` | `{ reason: 'user' \| 'api' \| 'superseded' \| 'destroy' \| 'detached' \| 'error', position }` | Fermeture d'un lecteur dont `open` a été émis. `detached` : le conteneur a été retiré du document (changement de route) ; `error` : échec d'une réouverture. Si un abonné à `pause` (raison `close`) rouvre le lecteur, `close` n'est pas émis. |
| `error` | `{ error: ReaderError }` | Échec d'ouverture, stockage indisponible (`fatal: false`), exception dans un abonné (`LISTENER`, `fatal: false`) |
| `settings-change` | `{ settings, changed, source: 'user' \| 'api' \| 'preferences' }` | Changement effectif de réglages (`changed` ⊂ `profile`, `speed`, `timing`, `acceleration`, `appearance`) |

Une exception levée par un abonné est isolée : elle n'interrompt ni la lecture ni les autres abonnés, et elle est signalée par `error`.

## Erreurs

`ReaderError` étend `Error` avec `code` et `fatal` :

| Code | Cause | Bloquant |
| --- | --- | --- |
| `INVALID_SOURCE` | Source absente, type inconnu, champ manquant ou de mauvais type | oui |
| `EMPTY_CONTENT` | Aucun mot lisible après extraction | oui |
| `PARSE_ERROR` | Échec inattendu de l'extraction | oui |
| `ENVIRONMENT` | `document`, `customElements`, `<dialog>` ou `DOMParser` indisponible | oui |
| `DESTROYED` | `open()` sur un lecteur détruit | oui |
| `ABORTED` | Ouverture rendue caduque par un `open()`, `close()` ou `destroy()` ultérieur | non |
| `STORAGE` | Lecture ou écriture des préférences impossible | non |
| `LISTENER` | Exception dans un abonné aux événements | non |

## Réglages et préférences

```ts
reader.getSettings();                  // copie des réglages actifs
reader.updateSettings({ profile: 'fast' });
reader.updateSettings({ timing: { comma: 2 }, appearance: { orpColor: '#1565c0' } });
reader.resetSettings();                // profil Standard, apparence par défaut

const prefs = reader.getPreferences(); // { version: 1, settings }
reader.setPreferences(prefs);          // retourne false si les préférences sont invalides ou d'une version inconnue
```

- Les règles de profil, les bornes et les coefficients sont détaillés dans [profiles-and-timing.md](profiles-and-timing.md).
- Une vitesse fournie à `updateSettings` est un changement manuel : elle arrête l'accélération en cours, quels que soient les autres champs du patch, **y compris si elle est égale à la vitesse stockée** ; après une accélération terminée, elle remplace la vitesse cible atteinte. Seule exception : si le même patch modifie et active l'accélération, la vitesse devient la vitesse de base et la montée repart de la vitesse de départ.
- Les constantes exportées (`PROFILES`, `TIMING_PRESETS`, `TIMING_BOUNDS`, `LABELS_FR`…) sont gelées en profondeur.
- Par défaut, **rien n'est écrit** dans `localStorage`. Avec `persistence.enabled`, chaque changement effectif est enregistré sous la clé configurée, au format `{ version: 1, settings }`.
- Les préférences ne contiennent **jamais** de texte source, de contenu lu, de position ni d'historique.
- Une erreur de stockage (quota dépassé, navigation privée…) émet `error` (`STORAGE`, non bloquant), et la lecture continue.
- Pour gérer vous-même la persistance, laissez la persistance désactivée. Écoutez `settings-change`, sauvegardez `getPreferences()`, puis fournissez-les via `createReader({ preferences })` ou `setPreferences()`.

## Autres exports

| Export | Rôle |
| --- | --- |
| `VERSION` | Version de la bibliothèque |
| `ReaderError`, `isReaderError` | Erreurs typées |
| `PROFILES`, `TIMING_PRESETS`, `TIMING_BOUNDS`, `SPEED`, `FONT_SIZE`, `ACCELERATION_DURATION`, `DEFAULT_ORP_COLOR` | Constantes immuables |
| `parseSource(source, options)` | Source vers modèle normalisé, sans interface |
| `splitOrp(word)`, `wordDuration(word, speed, timing)` | Calculs ORP et timing |
| `parsePreferences`, `PREFERENCES_VERSION`, `DEFAULT_STORAGE_KEY` | Préférences |
| `LABELS_FR`, `LABELS_EN` | Libellés intégrés |
| `defineReaderElement(tagName?)` | Enregistrement explicite de l'élément (idempotent) |

## Rendu serveur (SSR)

Le module s'importe sans DOM (Node, rendu serveur Vue ou Angular) : `HTMLElement` n'est lu qu'à l'ouverture. Appelez `open()` uniquement côté navigateur, par exemple dans `onMounted` ou `afterNextRender`.
