import { expect, test, type Page } from '@playwright/test';
import { gotoFixture, openSection, orpGeometry } from '../helpers';

/**
 * Alignement ORP mesuré dans le navigateur réel : la lettre ORP doit rester
 * centrée sur l'axe de fixation, quel que soit le mot, la police ou la taille.
 * (Les tests unitaires du calcul ne suffisent pas à valider le rendu.)
 */
const WORDS_TEXT =
  'a le chat lecture Bonjour, «\u{A0}Payez anticonstitutionnellement (voir) été 1\u{A0}000 👍🏽 WWWWWW iiiiii ' +
  'Donaudampfschifffahrtsgesellschaftskapitän internationalisation-supercalifragilistic';

test.beforeEach(async ({ page }) => {
  await gotoFixture(page);
  await openSection(page);
  await page.evaluate((text) => (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader.open({ type: 'text', text }), WORDS_TEXT);
});

async function checkAllWords(page: Page) {
  const total = await page.evaluate(() => (window as unknown as { reader: { getState(): { position: { total: number } } } }).reader.getState().position.total);
  const centers: number[] = [];
  for (let i = 0; i < total; i++) {
    await page.evaluate((i) => (window as unknown as { reader: { seek(i: number): void } }).reader.seek(i), i);
    const g = await orpGeometry(page);
    expect(Math.abs(g.pivotCenter - g.axis), `mot « ${g.text} »`).toBeLessThanOrEqual(1);
    expect(Math.abs(g.guideCenter - g.axis)).toBeLessThanOrEqual(1);
    // Le mot reste entièrement visible dans la zone RSVP.
    expect(g.wordLeft, `mot « ${g.text} »`).toBeGreaterThanOrEqual(g.stageLeft - 0.5);
    expect(g.wordRight, `mot « ${g.text} »`).toBeLessThanOrEqual(g.stageRight + 0.5);
    centers.push(g.pivotCenter);
  }
  // L'axe ne bouge pas d'un mot à l'autre.
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(1.5);
}

test('la lettre ORP reste fixe sur l’axe pour tous les mots', async ({ page }) => {
  await checkAllWords(page);
});

for (const fontFamily of ['serif', 'mono', 'readable'] as const) {
  test(`alignement conservé avec la police « ${fontFamily} » et une grande taille`, async ({ page }) => {
    await page.evaluate((fontFamily) => (window as unknown as { reader: { updateSettings(p: unknown): void } }).reader.updateSettings({ appearance: { fontFamily, fontSize: 80 } }), fontFamily);
    await checkAllWords(page);
  });
}

test('alignement conservé pendant la lecture et après redimensionnement', async ({ page }) => {
  await page.evaluate(() => (window as unknown as { reader: { setSpeed(n: number): void; play(): void } }).reader.setSpeed(150));
  await page.evaluate(() => (window as unknown as { reader: { play(): void } }).reader.play());
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(170);
    const g = await orpGeometry(page);
    expect(Math.abs(g.pivotCenter - g.axis)).toBeLessThanOrEqual(1);
  }
  const vp = page.viewportSize()!;
  await page.setViewportSize({ width: Math.round(vp.width * 0.8), height: vp.height });
  await page.waitForTimeout(100);
  const g = await orpGeometry(page);
  expect(Math.abs(g.pivotCenter - g.axis)).toBeLessThanOrEqual(1);
});

test('les mots longs sont réduits, les mots extrêmes segmentés avec trait d’union', async ({ page }) => {
  await page.evaluate(() => (window as unknown as { reader: { updateSettings(p: unknown): void } }).reader.updateSettings({ appearance: { fontSize: 96 } }));
  await page.locator('urr-reader .fulltext .w', { hasText: 'anticonstitutionnellement' }).click();
  const size = await page.locator('urr-reader .word').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeLessThan(96);
  expect(size).toBeGreaterThanOrEqual(16);
  await expect(page.locator('urr-reader .word')).toHaveText('anticonstitutionnellement');
  // Le texte intégral affiche le mot entier ; le lecteur RSVP le présente en segments.
  await expect(page.locator('urr-reader .fulltext')).toContainText('Donaudampfschifffahrtsgesellschaftskapitän');
  await page.locator('urr-reader .fulltext .w', { hasText: 'Donaudampfschi' }).click();
  await expect(page.locator('urr-reader .word')).toHaveText('Donaudampfschi\u{2010}');
});
