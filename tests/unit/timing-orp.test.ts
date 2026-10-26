import { describe, expect, it } from 'vitest';
import { TIMING_PRESETS } from '../../src/core/settings';
import { longWordMultiplier, pauseMultiplier, wordDuration } from '../../src/core/timing';
import { orpIndex, orpOffset, splitOrp } from '../../src/core/orp';
import { getSegmenter } from '../../src/core/segmentation';

const t = TIMING_PRESETS.normal;
const w = (over: Partial<{ punctuation: 'none' | 'comma' | 'clause' | 'sentence'; endsSentence: boolean; endsBlock: boolean; letterCount: number }> = {}) => ({
  punctuation: 'none' as const,
  endsSentence: false,
  endsBlock: false,
  letterCount: 4,
  ...over,
});

describe('timing adaptatif', () => {
  it('durée nominale = 60 000 / vitesse', () => {
    expect(wordDuration(w(), 250, t)).toBe(240);
    expect(wordDuration(w(), 900, t)).toBeCloseTo(66.667, 2);
  });

  it('applique les multiplicateurs de ponctuation', () => {
    expect(pauseMultiplier(w({ punctuation: 'comma' }), t)).toBe(1.5);
    expect(pauseMultiplier(w({ punctuation: 'clause' }), t)).toBe(1.75);
    expect(pauseMultiplier(w({ punctuation: 'sentence', endsSentence: true }), t)).toBe(2.25);
    expect(pauseMultiplier(w({ punctuation: 'sentence', endsSentence: true, endsBlock: true }), t)).toBe(3);
    // fin de bloc sans ponctuation (titre)
    expect(pauseMultiplier(w({ endsSentence: true, endsBlock: true }), t)).toBe(3);
  });

  it('allonge les mots longs de façon bornée', () => {
    expect(longWordMultiplier(8, t)).toBe(1);
    expect(longWordMultiplier(10, t)).toBeCloseTo(1.1);
    expect(longWordMultiplier(40, t)).toBe(1.5);
    expect(wordDuration(w({ letterCount: 10, punctuation: 'comma' }), 250, t)).toBeCloseTo(240 * 1.5 * 1.1);
  });

  it('les niveaux sont ordonnés faible < normal < fort', () => {
    const { light, normal, strong } = TIMING_PRESETS;
    for (const k of ['comma', 'clause', 'sentence', 'paragraph'] as const) {
      expect(light[k]).toBeLessThan(normal[k]);
      expect(normal[k]).toBeLessThan(strong[k]);
    }
  });
});

describe('ORP', () => {
  it('table de positions', () => {
    expect([1, 2, 5, 6, 9, 10, 13, 14, 30].map(orpOffset)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it.each([
    ['a', '', 'a', ''],
    ['le', 'l', 'e', ''],
    ['lecture', 'le', 'c', 'ture'],
    ['Bonjour,', 'Bo', 'n', 'jour,'],
    ['«\u{A0}Payez', '«\u{A0}P', 'a', 'yez'],
    ['(voir', '(v', 'o', 'ir'],
    ['anticonstitutionnellement', 'anti', 'c', 'onstitutionnellement'],
    ['été', 'é', 't', 'é'],
    ['—', '', '—', ''],
  ])('%s → %s[%s]%s', (word, before, pivot, after) => {
    expect(splitOrp(word)).toMatchObject({ before, pivot, after });
  });

  it('compte les graphèmes et non les unités UTF-16', () => {
    const s = splitOrp('e\u{301}le\u{300}ve');
    expect(s.pivot).toBe('l');
    const emoji = splitOrp('👨\u{200D}👩\u{200D}👧ab');
    expect(emoji.before).toBe('👨\u{200D}👩\u{200D}👧a');
  });

  it('est identique avec le segmenteur de repli', () => {
    const fb = getSegmenter('fr', 'fallback');
    for (const word of ['Bonjour,', 'e\u{301}le\u{300}ve', '🇫🇷 !', 'naïveté']) {
      expect(splitOrp(word, fb)).toEqual(splitOrp(word));
    }
  });

  it('est déterministe', () => {
    expect(orpIndex(['a', 'b', 'c'])).toBe(orpIndex(['a', 'b', 'c']));
  });
});
