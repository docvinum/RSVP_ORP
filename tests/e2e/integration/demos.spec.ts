import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

/**
 * Intégration : les trois démonstrateurs consomment le même artefact
 * compilé (dist/ copié dans vendor/) et offrent le même comportement.
 * Prérequis : `npm run build && npm run examples:build`.
 */
const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const DEMOS = [
  { name: 'JavaScript natif', path: '/examples/vanilla/index.html', dir: 'vanilla' },
  { name: 'Vue 3', path: '/examples/vue/dist/index.html', dir: 'vue' },
  { name: 'Angular', path: '/examples/angular/dist/browser/index.html', dir: 'angular' },
];

const SECTIONS: [string, RegExp][] = [
  ['dom', /Qu’est-ce que la lecture RSVP \?/],
  ['html', /La fixation du regard/],
  ['markdown', /Bonnes pratiques/],
  ['text', /Speed reading in English/],
];

const reader = (page: Page) =>
  page.evaluate(() => {
    const r = (window as unknown as { demo: { reader: { getState(): { status: string; speed: number } } | null } }).demo.reader;
    return r ? r.getState() : null;
  });

test('les trois démonstrateurs embarquent le même artefact', () => {
  const dist = readFileSync(join(ROOT, 'dist', 'manifest.json'), 'utf8');
  for (const demo of DEMOS) {
    expect(readFileSync(join(ROOT, 'examples', demo.dir, 'vendor', 'universal-rsvp-reader', 'manifest.json'), 'utf8')).toBe(dist);
  }
});

for (const demo of DEMOS) {
  test.describe(demo.name, () => {
    test.beforeEach(async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.goto(demo.path);
      await expect(page.locator('#reader-status')).not.toHaveText('—');
      expect(errors).toEqual([]);
    });

    test('chaque bouton « Lecture rapide » ouvre la bonne section (4 formats)', async ({ page }) => {
      for (const [section, expected] of SECTIONS) {
        const button = page.locator(`button[data-section="${section}"]`);
        await button.click();
        await expect(page.locator('urr-reader dialog')).toBeVisible();
        await expect(page.locator('urr-reader .fulltext')).toContainText(expected);
        await page.keyboard.press('Escape');
        await expect(page.locator('urr-reader')).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    });

    test('profils, réglages avancés et vue partagée', async ({ page }) => {
      await page.locator('button[data-section="dom"]').click();
      await page.getByRole('button', { name: 'Réglages', exact: true }).click();
      await page.getByText('Rapide', { exact: true }).click();
      expect((await reader(page))!.speed).toBe(400);
      await page.getByText('Fortes', { exact: true }).click();
      await expect(page.getByRole('radio', { name: 'Personnalisé' })).toBeChecked();
      await page.keyboard.press('Escape');
      await page.locator('urr-reader .fulltext .w', { hasText: 'axe' }).click();
      await expect(page.locator('urr-reader .word')).toHaveText('axe');
      expect((await reader(page))!.status).toBe('paused');
      await page.keyboard.press('Space');
      await expect.poll(async () => (await reader(page))!.status).toBe('playing');
      await page.keyboard.press('Escape');
      await expect(page.locator('#log')).toContainText('close (user)');
    });

    test('cycle de vie : changement de route, destruction, recréation', async ({ page }) => {
      await page.locator('button[data-section="dom"]').click();
      await expect(page.locator('urr-reader dialog')).toBeVisible();
      await page.evaluate(() => (location.hash = '#/a-propos'));
      await expect(page.locator('urr-reader')).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'À propos' })).toBeVisible();
      await page.evaluate(() => (location.hash = '#/articles'));
      await page.locator('#destroy').click();
      await expect(page.locator('#reader-status')).toHaveText('détruit');
      expect(await reader(page)).toBeNull();
      await page.locator('#recreate').click();
      await expect(page.locator('#reader-status')).toHaveText(/^créé/);
      await page.locator('button[data-section="markdown"]').click();
      await expect(page.locator('urr-reader dialog')).toBeVisible();
    });

    test('persistance : désactivée par défaut, activable par l’hôte', async ({ page }) => {
      await page.locator('button[data-section="text"]').click();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Escape');
      expect(await page.evaluate(() => localStorage.length)).toBe(0);
      await page.locator('#persist').check();
      await page.locator('button[data-section="text"]').click();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Escape');
      const stored = await page.evaluate(() => Object.keys(localStorage));
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatch(/^demo-.*:rsvp$/);
    });
  });
}
