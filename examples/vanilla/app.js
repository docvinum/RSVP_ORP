// Démonstrateur JavaScript natif : consomme uniquement l'artefact copié dans vendor/.
import { createReader, VERSION } from './vendor/universal-rsvp-reader/universal-rsvp-reader.js';

const HTML_SOURCE = `
  <h2>La fixation du regard</h2>
  <p>Lors de la lecture, l’œil ne glisse pas sur la ligne : il procède par <em>saccades</em> et par <strong>fixations</strong>.
  Chaque fixation dure environ un quart de seconde.</p>
  <script>alert('jamais exécuté')<\/script>
  <p>Le point de reconnaissance optimal se situe légèrement à gauche du centre du mot.</p>`;

const MARKDOWN_SOURCE = `## Bonnes pratiques

Commencez **lentement**, puis augmentez la vitesse par paliers de 25 mots par minute.

- Faites des pauses régulières.
- Relisez le texte intégral en cas de doute.

> La compréhension prime sur la vitesse.`;

const TEXT_SOURCE = `Speed reading in English.

The reader handles English text as well: contractions such as don't and it's, abbreviations like Mr. Smith or e.g. this one, and numbers such as 3.14 or 1,000.`;

const app = document.getElementById('app');
const log = document.getElementById('log');
const statusOut = document.getElementById('reader-status');
const persist = document.getElementById('persist');

let reader = null;
let offs = [];

function addLog(text) {
  const li = document.createElement('li');
  li.textContent = text;
  log.prepend(li);
  while (log.children.length > 40) log.lastChild.remove();
}

function create() {
  reader = createReader({ persistence: { enabled: persist.checked, storageKey: 'demo-vanilla:rsvp' } });
  offs = ['open', 'play', 'pause', 'complete', 'close', 'error', 'settings-change'].map((type) =>
    reader.on(type, (e) => {
      const detail = type === 'error' ? e.error.code : type === 'settings-change' ? e.changed.join(',') : type === 'close' || type === 'pause' ? e.reason : '';
      addLog(`${type}${detail ? ` (${detail})` : ''}`);
      statusOut.value = reader.getState().status;
    }),
  );
  statusOut.value = `créé (v${VERSION})`;
}

function destroy() {
  offs.forEach((off) => off());
  offs = [];
  reader?.destroy();
  reader = null;
  statusOut.value = 'détruit';
}

const sections = [
  { id: 'dom', format: 'DOM', title: 'Qu’est-ce que la lecture RSVP ?', html: null },
  { id: 'html', format: 'HTML', source: { type: 'html', html: HTML_SOURCE } },
  { id: 'markdown', format: 'Markdown', source: { type: 'markdown', markdown: MARKDOWN_SOURCE } },
  { id: 'text', format: 'Texte', source: { type: 'text', text: TEXT_SOURCE } },
];

function renderArticles() {
  app.replaceChildren();
  const dom = document.createElement('article');
  dom.id = 'section-dom';
  dom.innerHTML = `
    <p class="format">Source : DOM</p>
    <h2>Qu’est-ce que la lecture RSVP ?</h2>
    <p>La présentation visuelle sérielle rapide, ou RSVP, affiche un texte mot par mot, toujours au même endroit.
    Le regard n’a plus à parcourir les lignes : les mots viennent à lui.</p>
    <p>Une lettre de chaque mot est mise en évidence en rouge. Elle reste alignée sur un axe fixe, ce qui évite
    les mouvements oculaires inutiles. Les virgules, les fins de phrases et les fins de paragraphes allongent
    légèrement l’affichage ; les mots longs aussi.</p>`;
  app.append(dom);
  for (const s of sections) {
    const article = s.id === 'dom' ? dom : document.createElement('article');
    if (s.id !== 'dom') {
      article.id = `section-${s.id}`;
      const p = document.createElement('p');
      p.className = 'format';
      p.textContent = `Source : ${s.format} (chaîne transmise au lecteur)`;
      const pre = document.createElement('pre');
      pre.textContent = s.source.html ?? s.source.markdown ?? s.source.text;
      pre.style.whiteSpace = 'pre-wrap';
      article.append(p, pre);
      app.append(article);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'read';
    button.textContent = 'Lecture rapide';
    button.dataset.section = s.id;
    button.addEventListener('click', () => {
      if (!reader) create();
      const source = s.id === 'dom' ? { type: 'dom', element: article } : s.source;
      reader.open(source, s.id === 'text' ? { contentLocale: 'en' } : {}).catch((e) => addLog(`échec : ${e.code}`));
    });
    article.append(button);
  }
}

function renderAbout() {
  app.replaceChildren();
  const article = document.createElement('article');
  const h = document.createElement('h2');
  h.textContent = 'À propos';
  const p = document.createElement('p');
  p.textContent = 'Changer de page ferme le lecteur ouvert (cycle de vie). Le lecteur est réutilisé à la prochaine ouverture.';
  article.append(h, p);
  app.append(article);
}

function route() {
  // Changement de route : on ferme le lecteur (le contenu source va disparaître).
  reader?.close();
  if (location.hash === '#/a-propos') renderAbout();
  else renderArticles();
}

document.getElementById('destroy').addEventListener('click', destroy);
document.getElementById('recreate').addEventListener('click', () => {
  destroy();
  create();
});
persist.addEventListener('change', () => {
  destroy();
  create();
});
window.addEventListener('hashchange', route);
create();
route();
window.demo = { get reader() { return reader; } };
