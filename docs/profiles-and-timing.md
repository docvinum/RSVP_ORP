# Profils, timing et ORP

Toutes les valeurs ci-dessous sont des **paramètres de produit**. Elles ne disent rien des capacités cognitives de l'utilisateur. Elles sont centralisées dans `src/core/settings.ts` et `src/core/timing.ts`, et exportées sous forme de constantes immuables (`PROFILES`, `TIMING_PRESETS`, `TIMING_BOUNDS`, `SPEED`).

## Vitesse

| Paramètre | Valeur |
| --- | --- |
| Plage | 150 à 900 mots/minute |
| Défaut | 250 mots/minute |
| Pas | 25 (toute valeur est arrondie au pas le plus proche, puis bornée) |

La vitesse affichée est la **cadence nominale** : un mot sans pause dure `60 000 / vitesse` ms. La cadence effective est plus faible, à cause des pauses.

La vitesse se modifie à tout moment, y compris pendant la lecture. Le mot courant est alors replanifié à partir de son instant d'affichage. **Changer la vitesse ne fait jamais basculer le profil** : c'est un réglage de session (voir plus bas).

## Profils

| Profil | Vitesse initiale | Pauses | Accélération |
| --- | --- | --- | --- |
| Confort | 200 | Fortes | désactivée |
| Standard (défaut) | 250 | Normales | désactivée |
| Rapide | 400 | Faibles | désactivée |
| Personnalisé | au choix | au choix (dont le mode détaillé) | au choix |

Règles :

- Sélectionner un profil prédéfini charge sa vitesse et son niveau de pauses, et désactive l'accélération. Les paramètres de l'accélération sont conservés pour une réactivation ultérieure.
- Toute modification **effective** des pauses (niveau ou coefficient) ou de l'accélération sur un profil prédéfini bascule vers **Personnalisé**. Une modification sans effet (même valeur) ne bascule pas.
- La vitesse et l'apparence ne changent jamais le profil.
- Les profils prédéfinis sont gelés (`Object.freeze`) et ne peuvent pas être altérés.

## Formule de timing

```
durée(mot) = (60 000 / vitesse) × pause(mot) × motLong(mot)

pause(mot)   = max des coefficients applicables :
               virgule          → comma
               ; : — –          → clause
               fin de phrase    → sentence   (. ! ? … après détection des abréviations)
               fin de bloc      → paragraph  (paragraphe, titre, élément de liste…)
               sinon            → 1

motLong(mot) = 1 + min(longWordMaxExtra, (lettres − longWordThreshold) × longWordStep)
               si lettres > longWordThreshold, sinon 1
```

Seuls les lettres et les chiffres comptent comme « lettres », en graphèmes : « é » ou « 👍🏽 » valent un. La ponctuation attachée au mot (« Bonjour, », « va ! ») détermine la pause. Un point d'abréviation (« M. », « etc. », « J.-C. », initiales) n'en produit aucune. Des points de suspension suivis d'une minuscule produisent une pause de virgule.

## Niveaux de pauses

| Coefficient | Faibles | Normales | Fortes | Bornes |
| --- | --- | --- | --- | --- |
| `comma` (virgule) | 1,2 | 1,5 | 1,8 | 1 – 4 |
| `clause` (; : —) | 1,4 | 1,75 | 2,2 | 1 – 5 |
| `sentence` | 1,6 | 2,25 | 2,8 | 1 – 6 |
| `paragraph` | 2 | 3 | 4 | 1 – 8 |
| `longWordThreshold` (lettres) | 10 | 8 | 7 | 4 – 20 |
| `longWordStep` (par lettre) | 3 % | 5 % | 8 % | 0 – 25 % |
| `longWordMaxExtra` | 30 % | 50 % | 80 % | 0 – 200 % |

Les réglages détaillés modifient ces coefficients un par un. Toute valeur est validée et bornée. Si les coefficients ne correspondent plus à aucun niveau, le niveau devient « Personnalisées ». Il n'existe **qu'un seul moteur** : les réglages avancés ne font que changer ses paramètres.

Exemple à 300 mots/minute (200 ms par mot nominal), pauses normales : « Bonjour, » dure 300 ms et « monde. » en fin de paragraphe dure 600 ms. « anticonstitutionnellement » (25 lettres, sans ponctuation) dure 200 × 1,5 = 300 ms, car le supplément est plafonné à 50 %.

## Accélération progressive

Elle est facultative et **désactivée par défaut**.

| Paramètre | Défaut | Bornes |
| --- | --- | --- |
| Vitesse de départ | 250 | 150 – 900 (pas de 25) |
| Vitesse cible | 400 | ≥ départ, ≤ 900 |
| Durée de montée | 60 s | 5 – 600 s |
| Progression | linéaire | linéaire ou douce (`x² (3 − 2x)`) |

```
v(t) = départ + (cible − départ) × courbe(min(1, t / durée)),   arrondie, ≤ 900
```

- `t` est le **temps de lecture effectif** : la montée se suspend avec la pause et reprend ensuite. Le temps pendant lequel l'horloge est suspendue (onglet en arrière-plan) n'est pas compté.
- Activer l'accélération, ou en modifier un paramètre, réarme la montée depuis la vitesse de départ. Elle est aussi réarmée à chaque ouverture et quand on relance la lecture depuis la fin.
- **Changement manuel de vitesse pendant la montée** : la montée s'arrête et la vitesse choisie devient fixe jusqu'à la fin de la session (ou jusqu'au prochain réarmement).
- La montée achevée, la vitesse reste à la vitesse cible.

## Planification et horloge

- L'horloge est monotone (`performance.now()`). Chaque mot a une échéance (`affichage + durée`) ; le suivant est planifié à partir de l'échéance précédente, ce qui compense la dérive des minuteries.
- Quand la minuterie se réveille avec plus de 250 ms de retard (onglet gelé, veille), le moteur affiche **un seul** mot suivant et se recale sur l'instant présent : ni rafale, ni saut. Par défaut, la lecture est de toute façon mise en pause quand l'onglet devient invisible.
- Une seule minuterie au plus est active par lecteur.

## Algorithme ORP

1. Le mot affiché est découpé en graphèmes Unicode.
2. La partie lexicale va du premier au dernier graphème lettre ou chiffre. La ponctuation attenante (« ( », « « », « , ») est exclue du calcul.
3. La position dans la partie lexicale dépend de sa longueur L :

| L | 1 | 2 – 5 | 6 – 9 | 10 – 13 | ≥ 14 |
| --- | --- | --- | --- | --- | --- |
| Position (depuis 0) | 0 | 1 | 2 | 3 | 4 |

4. Sans lettre ni chiffre, le graphème central est retenu.

**Rendu** : le centre de la lettre ORP est placé sur l'axe (38 % de la largeur), à partir des largeurs réellement mesurées. Le calcul de placement (`computePlacement`) est une fonction pure, testée séparément ; le rendu est vérifié au pixel près dans Chromium, sur desktop et mobile, avec quatre polices.

## Mots longs

- Un mot qui déborderait de la zone RSVP est **réduit** (même axe, même lettre ORP) jusqu'à 16 px au minimum.
- Au-delà de **25 lettres**, un mot est **découpé** en segments équilibrés d'au plus 16 lettres, de préférence aux traits d'union. Les segments s'affichent successivement, chacun suivi d'un trait d'union de continuation (« Donaudampfschi‐ », « fffahrtsgesell‐ », « schaftskapitän »). Le texte intégral montre le mot entier. Ce découpage est déterministe et fait partie du modèle normalisé (`Word.continues`).
