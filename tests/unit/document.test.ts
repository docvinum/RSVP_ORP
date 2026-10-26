import { describe, expect, it } from 'vitest';
import { buildDocument, wordIndexAtOffset } from '../../src/core/document';
import { normalizeText } from '../../src/core/normalize';
import type { NormalizedDocument } from '../../src/core/model';

const para = (text: string) => ({ kind: 'paragraph' as const, text });
const words = (doc: NormalizedDocument) => doc.words.map((w) => w.text);

describe.each(['intl', 'fallback'] as const)('buildDocument (%s)', (segmentation) => {
  const build = (...texts: string[]) => buildDocument(texts.map(para), { segmentation });

  it('découpe en mots de lecture avec la ponctuation attenante', () => {
    const doc = build('Bonjour, le monde. Comment ça va ?');
    expect(words(doc)).toEqual(['Bonjour,', 'le', 'monde.', 'Comment', 'ça', 'va ?']);
    expect(doc.segmentation).toBe(segmentation);
  });

  it('conserve accents, apostrophes et mots composés', () => {
    const doc = build("L'élève d’aujourd’hui a mangé une crème brûlée — c'est-à-dire, un dessert.");
    expect(words(doc)).toEqual([
      "L'élève",
      'd’aujourd’hui',
      'a',
      'mangé',
      'une',
      'crème',
      'brûlée —',
      "c'est-à-dire,",
      'un',
      'dessert.',
    ]);
  });

  it('gère la typographie française (guillemets, espaces insécables, milliers)', () => {
    const doc = build('Il a dit\u{A0}: «\u{A0}Payez 1\u{202F}000\u{202F}000\u{A0}€\u{A0}!\u{A0}» Puis 3,14 et 10:30.');
    expect(words(doc)).toEqual([
      'Il',
      'a',
      'dit\u{A0}:',
      '«\u{A0}Payez',
      '1\u{202F}000\u{202F}000\u{A0}€\u{A0}!\u{A0}»',
      'Puis',
      '3,14',
      'et',
      '10:30.',
    ]);
    expect(doc.words[2]!.punctuation).toBe('clause');
    expect(doc.words[4]!.punctuation).toBe('sentence');
    expect(doc.sentences).toHaveLength(2);
  });

  it('ne coupe pas les phrases sur les abréviations et initiales', () => {
    const doc = build('M. Dupont et Mme Durand, cf. p. 12, ont vu J. K. Rowling. Dr. Who arrive. Mr. Smith too.');
    expect(doc.sentences.map((s) => doc.text.slice(s.start, s.end))).toEqual([
      'M. Dupont et Mme Durand, cf. p. 12, ont vu J. K. Rowling.',
      'Dr. Who arrive.',
      'Mr. Smith too.',
    ]);
    expect(doc.words[0]!.punctuation).toBe('none');
  });

  it('« etc. » termine une phrase seulement si la suite est capitalisée', () => {
    const doc = build('Pommes, poires, etc. Ensuite des fraises, etc. et des noix.');
    expect(doc.sentences).toHaveLength(2);
  });

  it('les points de suspension suivis d’une minuscule ne terminent pas la phrase', () => {
    const doc = build('Il hésita… puis partit. Fin.');
    expect(doc.sentences).toHaveLength(2);
    expect(doc.words[1]!.punctuation).toBe('comma');
  });

  it('gère l’anglais et les contractions', () => {
    const doc = build("It's the U.S. Army's best e.g. option. Don't panic! Really?");
    expect(words(doc)).toContain("Don't");
    expect(doc.sentences.map((s) => doc.text.slice(s.start, s.end))).toEqual([
      "It's the U.S. Army's best e.g. option.",
      "Don't panic!",
      'Really?',
    ]);
  });

  it('gère emoji, graphèmes combinés et symboles', () => {
    const doc = build('Super 👍🏽 la famille 👨\u{200D}👩\u{200D}👧 et e\u{301}te\u{301} 🇫🇷 !');
    expect(words(doc)).toEqual(['Super 👍🏽', 'la', 'famille 👨\u{200D}👩\u{200D}👧', 'et', 'été 🇫🇷 !']);
    // é décomposé normalisé en NFC
    expect(doc.words[4]!.text.startsWith('été')).toBe(true);
    expect(doc.words[4]!.letterCount).toBe(3);
  });

  it('produit des blocs, phrases et index stables et cohérents', () => {
    const doc = build('Premier paragraphe. Deux phrases.', 'Second paragraphe.');
    expect(doc.text).toBe('Premier paragraphe. Deux phrases.\n\nSecond paragraphe.');
    expect(doc.blocks).toHaveLength(2);
    expect(doc.blocks[1]).toMatchObject({ wordStart: 4, wordEnd: 6, sentenceStart: 2, sentenceEnd: 3 });
    doc.words.forEach((w, i) => {
      expect(w.index).toBe(i);
      expect(doc.text.slice(w.start, w.end)).toBe(w.text);
      const s = doc.sentences[w.sentenceIndex]!;
      expect(i >= s.wordStart && i < s.wordEnd).toBe(true);
      expect(s.blockIndex).toBe(w.blockIndex);
      for (let t = w.tokenStart; t < w.tokenEnd; t++) {
        const tok = doc.tokens[t]!;
        expect(tok.start >= w.start && tok.end <= w.end).toBe(true);
        if (tok.kind !== 'space') expect(tok.wordIndex).toBe(i);
      }
    });
    doc.tokens.forEach((t, i) => {
      expect(t.index).toBe(i);
      expect(doc.text.slice(t.start, t.end)).toBe(t.text);
    });
    expect(doc.words[3]).toMatchObject({ endsSentence: true, endsBlock: true });
    // Déterminisme
    expect(build('Premier paragraphe. Deux phrases.', 'Second paragraphe.')).toEqual(doc);
  });

  it('ignore les blocs vides et normalise les espaces', () => {
    const doc = build('  \n\t ', 'Un\n  texte\u{200B}   sur\u{AD}plusieurs\r\nlignes  ');
    expect(doc.blocks).toHaveLength(1);
    expect(doc.text).toBe('Un texte surplusieurs lignes');
  });

  it('segmente les écritures sans espaces', () => {
    const doc = build('我喜欢读书。');
    if (segmentation === 'intl') expect(doc.words.length).toBeGreaterThan(1);
    expect(doc.words.map((w) => w.text).join('')).toBe('我喜欢读书。');
  });
});

describe('mots très longs', () => {
  it('découpe au-delà de 25 lettres en segments équilibrés, aux index stables', () => {
    const doc = buildDocument([{ kind: 'paragraph', text: 'Le Donaudampfschifffahrtsgesellschaftskapitän arrive, anticonstitutionnellement.' }]);
    const texts = doc.words.map((w) => w.text);
    expect(texts).toEqual(['Le', 'Donaudampfschi', 'fffahrtsgesell', 'schaftskapitän', 'arrive,', 'anticonstitutionnellement.']);
    expect(doc.words.map((w) => w.continues)).toEqual([false, true, true, false, false, false]);
    // Le texte intégral reste intact et la correspondance mot ↔ texte est conservée.
    expect(doc.text).toContain('Donaudampfschifffahrtsgesellschaftskapitän');
    for (const w of doc.words) expect(doc.text.slice(w.start, w.end)).toBe(w.text);
    expect(doc.words[1]!.punctuation).toBe('none');
  });

  it('garantit au plus 16 lettres par segment, même quand un token dépasse cette taille', () => {
    const doc = buildDocument([{ kind: 'paragraph', text: 'internationalisation-supercalifragilistic.' }]);
    expect(doc.words.map((w) => w.text)).toEqual(['internatio', 'nalisation-', 'supercalif', 'ragilistic.']);
    expect(doc.words.every((w) => w.letterCount <= 16)).toBe(true);
    expect(doc.words.map((w) => w.continues)).toEqual([true, true, true, false]);
    expect(doc.words[3]!.punctuation).toBe('sentence');
    const short = buildDocument([{ kind: 'paragraph', text: 'anticonstitutionnellement' }], { maxWordLength: 12 });
    expect(short.words.length).toBe(2);
  });

  it.each(['intl', 'fallback'] as const)('invariants des segments sur des mots variés (%s)', (segmentation) => {
    const samples = [
      'a'.repeat(26),
      'é'.repeat(40),
      'e\u{301}'.repeat(30),
      'abc-'.repeat(12) + 'fin',
      'l’' + 'x'.repeat(60) + '!',
      '123456789'.repeat(5),
      'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz',
    ];
    for (const sample of samples) {
      const doc = buildDocument([{ kind: 'paragraph', text: `Début ${sample} fin.` }], { segmentation });
      for (const w of doc.words) {
        expect(w.letterCount, w.text).toBeLessThanOrEqual(25);
        if (w.continues || doc.words[w.index - 1]?.continues) expect(w.letterCount, w.text).toBeLessThanOrEqual(16);
        expect(doc.text.slice(w.start, w.end)).toBe(w.text);
      }
      // Les segments recouvrent exactement le mot d'origine.
      const joined = doc.words.slice(1, -1).map((w) => w.text).join('');
      expect(joined).toBe(doc.text.slice(doc.words[1]!.start, doc.words[doc.words.length - 2]!.end));
      doc.tokens.forEach((t, i) => expect(t.index).toBe(i));
    }
  });
});

describe('performance', () => {
  it.each(['intl', 'fallback'] as const)('reste linéaire sur une ponctuation massive (%s)', (segmentation) => {
    // 64 000 groupes de ponctuation (128 000 caractères) : ~12,8 s avant correction.
    const text = Array.from({ length: 64_000 }, () => '! ').join('') + 'fin';
    const t0 = performance.now();
    const doc = buildDocument([{ kind: 'paragraph', text }], { segmentation });
    expect(performance.now() - t0).toBeLessThan(3000);
    expect(doc.words).toHaveLength(1);
  });

  it('traite un long document ordinaire rapidement', () => {
    const para = 'Un paragraphe ordinaire, avec de la ponctuation ; des « guillemets » et 1 000 mots. ';
    const text = Array.from({ length: 2000 }, () => para).join('\n\n');
    const t0 = performance.now();
    const doc = buildDocument(text.split('\n\n').map((t) => ({ kind: 'paragraph' as const, text: t })));
    expect(performance.now() - t0).toBeLessThan(3000);
    expect(doc.words.length).toBeGreaterThan(20_000);
  });
});

describe('normalizeText', () => {
  it('normalise NFC et fusionne les espaces mixtes', () => {
    expect(normalizeText('a \u{A0} b\u{3000}c')).toBe('a\u{A0}b c');
    expect(normalizeText('Cafe\u{301}')).toBe('Café');
  });
});

describe('wordIndexAtOffset', () => {
  it('retrouve le mot à un offset du texte normalisé', () => {
    const doc = buildDocument([para('un deux trois')]);
    expect(wordIndexAtOffset(doc, 0)).toBe(0);
    expect(wordIndexAtOffset(doc, 4)).toBe(1);
    expect(wordIndexAtOffset(doc, 3)).toBe(1);
    expect(wordIndexAtOffset(doc, 100)).toBe(2);
  });
});
