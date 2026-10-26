import { expect, test, type Page } from '@playwright/test';
import { gotoFixture } from '../helpers';

/**
 * Régression visuelle des composants critiques. Les captures de référence
 * dépendent des polices du système : elles sont générées sur l'environnement
 * de référence (Linux, Chromium épinglé) via `npm run test:visual:update`.
 */
const TEXT = 'Lecture rapide : la lettre de fixation reste alignée. Anticonstitutionnellement, «\u{A0}voilà\u{A0}» !';

/**
 * Pour les captures pleine page, les zones de texte courant (rendu des polices
 * propre à chaque machine) sont masquées : la mise en page reste vérifiée, et
 * la zone ORP a ses propres captures non masquées.
 */
const textMasks = (page: Page) => [
  page.locator('urr-reader header h2'),
  page.locator('urr-reader .fulltext'),
  page.locator('urr-reader .progress span'),
  page.locator('urr-reader .speed output'),
  page.locator('urr-reader .panel form'),
  page.locator('urr-reader .settings-button-label, urr-reader header button .label'),
];

async function open(page: Page, settings: Record<string, unknown> = {}, index = 0) {
  await gotoFixture(page);
  await page.evaluate(
    async ({ text, settings, index }) => {
      const r = (window as unknown as { reader: { updateSettings(p: unknown): void; open(s: unknown, o: unknown): Promise<void> } }).reader;
      r.updateSettings(settings);
      await r.open({ type: 'text', text }, { title: 'Régression visuelle', startAt: index });
    },
    { text: TEXT, settings, index },
  );
  await page.locator('urr-reader dialog').waitFor();
  // Retire le focus pour une capture stable.
  await page.evaluate(() => (document.querySelector('urr-reader')!.shadowRoot!.activeElement as HTMLElement | null)?.blur());
}

for (const [label, index] of [['mot-court', 1], ['mot-long', 9], ['guillemets', 10]] as const) {
  test(`zone ORP — ${label}`, async ({ page }) => {
    await open(page, {}, index);
    await expect(page.locator('urr-reader .stage')).toHaveScreenshot(`stage-${label}.png`);
  });
}

test('zone ORP — personnalisation (police, couleur, sans repères, sombre)', async ({ page }) => {
  await open(page, { appearance: { fontFamily: 'serif', fontSize: 64, orpColor: '#1565c0', showGuides: false, theme: 'dark' } }, 3);
  await expect(page.locator('urr-reader .stage')).toHaveScreenshot('stage-custom-dark.png');
});

test('modale desktop', async ({ page }) => {
  await open(page, {}, 4);
  await expect(page).toHaveScreenshot('dialog-desktop.png', { mask: textMasks(page) });
});

test('modale desktop avec réglages', async ({ page }) => {
  await open(page, {}, 4);
  await page.getByRole('button', { name: 'Réglages', exact: true }).click();
  await page.evaluate(() => (document.querySelector('urr-reader')!.shadowRoot!.activeElement as HTMLElement | null)?.blur());
  await expect(page).toHaveScreenshot('dialog-desktop-settings.png', { mask: textMasks(page) });
});

test('plein écran mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, {}, 4);
  await expect(page).toHaveScreenshot('dialog-mobile.png', { mask: textMasks(page) });
});
