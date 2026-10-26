// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { parseSource, sourceToBlocks } from '../../src/parsers';
import { ReaderError } from '../../src/core/errors';

const texts = (blocks: { text: string }[]) => blocks.map((b) => b.text.replace(/\s+/g, ' ').trim());

afterEach(() => {
  document.body.innerHTML = '';
});

describe('texte brut', () => {
  it('sépare les paragraphes sur les lignes vides', () => {
    const blocks = sourceToBlocks({ type: 'text', text: 'Un\ndeux.\r\n\r\n  \nTrois.\n\n\n' });
    expect(texts(blocks)).toEqual(['Un deux.', 'Trois.']);
  });
});

describe('HTML (analyse inerte)', () => {
  it('extrait le texte des blocs et ignore les contenus non pertinents', () => {
    const html = `
      <h1>Titre <em>principal</em></h1>
      <nav>Menu Accueil</nav>
      <p>Premier <a href="#">lien</a> et <strong>gras</strong>.<br>Suite</p>
      <script>window.__pwned = true</script>
      <style>p { color: red }</style>
      <button>Cliquer</button><input value="champ">
      <div hidden>caché</div><span aria-hidden="true">déco</span>
      <ul><li>Point un</li><li>Point deux</li></ul>
      <blockquote><p>Citation</p></blockquote>
      <table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>
      <pre>code   ici</pre>
      <img src="x" onerror="window.__pwned = true" alt="image">
      <div class="pub">Publicité</div>
      <div data-rsvp-ignore>ignoré</div>
      <svg><text>svg</text></svg>
      <template><p>modèle</p></template>`;
    const blocks = sourceToBlocks({ type: 'html', html }, { exclude: '.pub' });
    expect(texts(blocks)).toEqual([
      'Titre principal',
      'Premier lien et gras. Suite',
      'Point un',
      'Point deux',
      'Citation',
      'A B',
      '1 2',
      'code ici',
    ]);
    expect(blocks.map((b) => b.kind)).toEqual(['heading', 'paragraph', 'list-item', 'list-item', 'quote', 'table-row', 'table-row', 'code']);
    expect(blocks[0]).toMatchObject({ level: 1 });
    expect((window as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('gère le HTML mal formé et les entités', () => {
    const blocks = sourceToBlocks({ type: 'html', html: '<p>Caf&eacute; &amp; th&#233;<p>Sans fermeture <b>gras' });
    expect(texts(blocks)).toEqual(['Café & thé', 'Sans fermeture gras']);
  });

  it('le texte inline entre deux blocs forme son propre bloc', () => {
    const blocks = sourceToBlocks({ type: 'html', html: '<div>Avant<p>Milieu</p>Après</div>' });
    expect(texts(blocks)).toEqual(['Avant', 'Milieu', 'Après']);
  });
});

describe('Markdown', () => {
  it('construit les blocs depuis le flux de tokens', () => {
    const md = [
      '# Titre *important*',
      '',
      'Un paragraphe avec un [lien](https://example.com) et du `code`.',
      'Suite du paragraphe.',
      '',
      '- élément un',
      '- élément **deux**',
      '',
      '> Une citation',
      '',
      '```js',
      'const x = 1;',
      '```',
      '',
      '| A | B |',
      '|---|---|',
      '| 1 | 2 |',
      '',
      '![image](x.png)',
      '',
      '<div onclick="alert(1)">HTML <b>brut</b></div>',
      '',
      'Texte avec <span>html</span> inline.',
    ].join('\n');
    const blocks = sourceToBlocks({ type: 'markdown', markdown: md });
    expect(texts(blocks)).toEqual([
      'Titre important',
      'Un paragraphe avec un lien et du code. Suite du paragraphe.',
      'élément un',
      'élément deux',
      'Une citation',
      'const x = 1;',
      'A B',
      '1 2',
      'HTML brut',
      'Texte avec html inline.',
    ]);
    expect(blocks.map((b) => b.kind)).toEqual([
      'heading', 'paragraph', 'list-item', 'list-item', 'quote', 'code', 'table-row', 'table-row', 'paragraph', 'paragraph',
    ]);
  });
});

describe('Markdown — HTML inline', () => {
  const md = 'Avant<br>Après et <span hidden>secret</span>visible <script>alert(1)</script>fin <b>gr</b>as &amp; co.';

  it('conserve les frontières de mots et applique les exclusions (DOM)', () => {
    expect(texts(sourceToBlocks({ type: 'markdown', markdown: md }))).toEqual(['Avant Après et visible fin gras & co.']);
  });

  it('repli sans DOMParser : frontières conservées, scripts exclus', () => {
    const g = globalThis as { DOMParser?: unknown };
    const saved = g.DOMParser;
    delete g.DOMParser;
    try {
      const blocks = sourceToBlocks({ type: 'markdown', markdown: `${md}\n\n<div>Bloc <script>x()</script>HTML</div>` });
      expect(texts(blocks)).toEqual(['Avant Après et secretvisible fin gras & co.', 'Bloc HTML']);
    } finally {
      g.DOMParser = saved;
    }
  });
});

describe('DOM (lecture seule)', () => {
  function fixture() {
    document.body.innerHTML = `
      <main lang="en">
        <article id="a">
          <h2>Section <span style="display:none">invisible</span>title</h2>
          <p>Hello <em>world</em>. It's fine.</p>
          <button>Lecture rapide</button>
          <p style="visibility:hidden">Hidden</p>
          <div role="toolbar"><span>tools</span></div>
        </article>
      </main>`;
    return document.getElementById('a')!;
  }

  it('extrait le texte visible et la langue déclarée', () => {
    const el = fixture();
    const doc = parseSource({ type: 'dom', element: el });
    expect(doc.text).toBe("Section title\n\nHello world. It's fine.");
    expect(doc.locale).toBe('en');
    expect(doc.blocks[0]).toMatchObject({ kind: 'heading', level: 2 });
  });

  it('ne modifie jamais le DOM source', () => {
    const el = fixture();
    const before = document.body.innerHTML;
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((m) => mutations.push(...m));
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    parseSource({ type: 'dom', element: el });
    parseSource({ type: 'dom', element: el }, { exclude: 'h2' });
    mutations.push(...observer.takeRecords());
    observer.disconnect();
    expect(mutations).toEqual([]);
    expect(document.body.innerHTML).toBe(before);
  });

  it('lit l’élément racine même s’il est masqué', () => {
    document.body.innerHTML = '<section hidden><p>Contenu</p></section>';
    const doc = parseSource({ type: 'dom', element: document.querySelector('section')! });
    expect(doc.text).toBe('Contenu');
  });
});

describe('erreurs', () => {
  const code = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      expect(e).toBeInstanceOf(ReaderError);
      return (e as ReaderError).code;
    }
    return 'none';
  };

  it('signale les sources invalides ou vides', () => {
    expect(code(() => parseSource(null as never))).toBe('INVALID_SOURCE');
    expect(code(() => parseSource({ type: 'pdf' } as never))).toBe('INVALID_SOURCE');
    expect(code(() => parseSource({ type: 'text', text: 42 } as never))).toBe('INVALID_SOURCE');
    expect(code(() => parseSource({ type: 'dom', element: {} } as never))).toBe('INVALID_SOURCE');
    expect(code(() => parseSource({ type: 'text', text: '   ' }))).toBe('EMPTY_CONTENT');
    expect(code(() => parseSource({ type: 'html', html: '<script>x</script>' }))).toBe('EMPTY_CONTENT');
  });

  it('les quatre formats produisent le même modèle pour un contenu équivalent', () => {
    const fromText = parseSource({ type: 'text', text: 'Bonjour le monde.\n\nDeuxième paragraphe.' });
    const fromHtml = parseSource({ type: 'html', html: '<p>Bonjour le <b>monde</b>.</p><p>Deuxième paragraphe.</p>' });
    const fromMd = parseSource({ type: 'markdown', markdown: 'Bonjour le **monde**.\n\nDeuxième paragraphe.' });
    document.body.innerHTML = '<div id="x"><p>Bonjour le monde.</p><p>Deuxième paragraphe.</p></div>';
    const fromDom = parseSource({ type: 'dom', element: document.getElementById('x')! });
    for (const d of [fromHtml, fromMd, fromDom]) {
      expect(d.text).toBe(fromText.text);
      expect(d.words).toEqual(fromText.words);
    }
  });
});
