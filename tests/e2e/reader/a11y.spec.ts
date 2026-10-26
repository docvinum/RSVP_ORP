import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { dialog, gotoFixture, openSection } from '../helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const AXE_PATH = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

/** Analyse axe-core limitée au lecteur ; retourne les violations sous forme lisible. */
async function axeViolations(page: Page): Promise<string[]> {
  if (!(await page.evaluate(() => 'axe' in window))) await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async (tags) => {
    const axe = (window as unknown as { axe: { run(ctx: unknown, opts: unknown): Promise<{ violations: { id: string; nodes: { target: unknown[] }[] }[] }> } }).axe;
    const res = await axe.run({ include: [['urr-reader']] }, { runOnly: { type: 'tag', values: tags } });
    return res.violations.map((v) => `${v.id}: ${v.nodes.map((n) => JSON.stringify(n.target)).join(', ')}`);
  }, TAGS);
}

test.beforeEach(async ({ page }) => {
  await gotoFixture(page);
});

for (const theme of ['light', 'dark'] as const) {
  test(`aucune violation axe (WCAG 2.2 AA) — thème ${theme}, réglages ouverts`, async ({ page }) => {
    await openSection(page);
    await page.evaluate((theme) => (window as unknown as { reader: { updateSettings(p: unknown): void } }).reader.updateSettings({ appearance: { theme } }), theme);
    await page.keyboard.press('ArrowRight');
    expect(await axeViolations(page)).toEqual([]);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.getByText('Réglages détaillés').click();
    expect(await axeViolations(page)).toEqual([]);
  });
}

test('le texte intégral est exposé aux technologies d’assistance, sans annonce mot à mot', async ({ page }) => {
  await openSection(page);
  const region = page.getByRole('region', { name: 'Texte intégral' });
  await expect(region).toBeVisible();
  await expect(region).toContainText('Bonjour, voici un texte de démonstration.');
  // Le mot RSVP est masqué aux lecteurs d'écran ; aucune région live ne le contient.
  await expect(page.locator('urr-reader .word')).toHaveAttribute('aria-hidden', 'true');
  const liveRegions = page.locator('urr-reader [aria-live]');
  await expect(liveRegions).toHaveCount(1);
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  await expect(liveRegions.first()).toHaveText('Lecture en cours');
});

test('le focus reste dans la modale (Tab circule entre les commandes)', async ({ page }) => {
  await openSection(page);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => document.activeElement?.tagName.toLowerCase() === 'urr-reader');
    if (!inside) {
      // Chromium peut passer le focus à l'interface du navigateur : jamais à la page.
      const active = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
      expect(['body', 'urr-reader']).toContain(active);
    }
  }
  await expect(dialog(page)).toBeVisible();
  expect(await page.evaluate(() => document.getElementById('t2') === document.activeElement)).toBe(false);
});

test('respecte prefers-reduced-motion (suivi sans animation)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const text = Array.from({ length: 40 }, (_, i) => `Paragraphe ${i}. Texte suffisamment long pour occuper plusieurs lignes dans la vue intégrale.`).join('\n\n');
    return (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader.open({ type: 'text', text });
  });
  const top = await page.evaluate(() => {
    (window as unknown as { reader: { seek(i: number): void } }).reader.seek(300);
    // Lecture synchrone : sans animation, le défilement est immédiat.
    return document.querySelector('urr-reader')!.shadowRoot!.querySelector('.fulltext')!.scrollTop;
  });
  expect(top).toBeGreaterThan(0);
});

test('mobile : plein écran, disposition verticale', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile uniquement');
  await openSection(page);
  const vp = page.viewportSize()!;
  const box = (await dialog(page).boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(Math.round(box.width)).toBe(vp.width);
  expect(Math.round(box.height)).toBe(vp.height);
  const stage = (await page.locator('urr-reader .stage').boundingBox())!;
  const full = (await page.locator('urr-reader .fulltext').boundingBox())!;
  expect(stage.y).toBeLessThan(full.y);
  // Le texte intégral occupe la partie basse et se touche pour repositionner.
  await page.locator('urr-reader .fulltext .w').nth(4).tap();
  await expect(page.locator('urr-reader .fulltext .w.cur')).toHaveAttribute('data-w', '4');
  // Panneau de réglages dédié ; la zone RSVP reste visible au-dessus.
  await page.getByRole('button', { name: 'Réglages', exact: true }).tap();
  const panel = (await page.getByRole('region', { name: 'Réglages' }).boundingBox())!;
  expect(panel.y).toBeGreaterThanOrEqual(stage.y + stage.height - 1);
  await expect(page.locator('urr-reader .word')).toBeInViewport();
});

test('desktop : modale centrée', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'desktop uniquement');
  await openSection(page);
  const vp = page.viewportSize()!;
  const box = (await dialog(page).boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - vp.width / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs(box.y + box.height / 2 - vp.height / 2)).toBeLessThanOrEqual(1);
  expect(box.width).toBeLessThan(vp.width);
});
