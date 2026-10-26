import { expect, test, type Page } from '@playwright/test';
import { dialog, gotoFixture, instrument, openSection, state } from '../helpers';

type Leaks = { timers: number; window: number; document: number; matchMedia: number; observers: number };
const leaks = (page: Page) => page.evaluate(() => (window as unknown as { __leaks(): Leaks }).__leaks());

test.beforeEach(async ({ page }) => {
  await instrument(page);
  await gotoFixture(page);
});

test('aucune mutation du DOM source ni style global injecté', async ({ page }) => {
  const before = await page.evaluate(() => {
    const w = window as unknown as { __mutations: MutationRecord[] };
    w.__mutations = [];
    const observer = new MutationObserver((m) => w.__mutations.push(...m));
    observer.observe(document.getElementById('s1')!, { subtree: true, childList: true, attributes: true, characterData: true });
    (w as unknown as { __observer: MutationObserver }).__observer = observer;
    return {
      html: document.getElementById('s1')!.outerHTML,
      head: document.head.innerHTML,
      sheets: document.styleSheets.length,
      adopted: document.adoptedStyleSheets.length,
      bodyStyle: document.body.getAttribute('style'),
      htmlStyle: document.documentElement.getAttribute('style'),
    };
  });
  await openSection(page);
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.locator('urr-reader .fulltext .w').nth(3).click();
  await page.getByRole('button', { name: 'Réglages', exact: true }).click();
  await page.getByText('Rapide', { exact: true }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('urr-reader')).toHaveCount(0);
  const after = await page.evaluate(() => {
    const w = window as unknown as { __mutations: MutationRecord[]; __observer: MutationObserver };
    w.__mutations.push(...w.__observer.takeRecords());
    return {
      html: document.getElementById('s1')!.outerHTML,
      head: document.head.innerHTML,
      sheets: document.styleSheets.length,
      adopted: document.adoptedStyleSheets.length,
      bodyStyle: document.body.getAttribute('style'),
      htmlStyle: document.documentElement.getAttribute('style'),
      mutations: w.__mutations.length,
    };
  });
  expect(after).toEqual({ ...before, mutations: 0 });
});

test('ouvertures successives fiables et ressources libérées', async ({ page }) => {
  const baseline = await leaks(page);
  for (let i = 0; i < 5; i++) {
    await openSection(page, i % 2 ? 't2' : 't1');
    await page.keyboard.press('Space');
    await page.waitForTimeout(120);
    expect((await state(page)).status).toBe('playing');
    await page.keyboard.press('Escape');
    await expect(page.locator('urr-reader')).toHaveCount(0);
    expect(await leaks(page)).toEqual(baseline);
  }
  await page.evaluate(() => (window as unknown as { reader: { destroy(): void } }).reader.destroy());
  await page.evaluate(() => (window as unknown as { reader: { destroy(): void } }).reader.destroy());
  expect(await leaks(page)).toEqual(baseline);
  expect((await state(page)).status).toBe('destroyed');
});

test('changement de route : le conteneur retiré ferme le lecteur et libère tout', async ({ page }) => {
  const baseline = await leaks(page);
  await page.evaluate(async () => {
    const URR = (window as unknown as { URR: { createReader(o: unknown): unknown } }).URR;
    const outlet = document.createElement('div');
    outlet.id = 'outlet';
    document.body.append(outlet);
    const r = URR.createReader({ container: outlet }) as { open(s: unknown): Promise<void>; play(): void; on(t: string, f: (e: { reason: string }) => void): void };
    (window as unknown as { routed: unknown }).routed = r;
    r.on('close', (e) => ((window as unknown as { closeReason: string }).closeReason = e.reason));
    await r.open({ type: 'dom', element: document.getElementById('s1') });
    r.play();
  });
  await expect(page.locator('#outlet urr-reader dialog')).toBeVisible();
  // Le routeur détruit la vue : le conteneur disparaît sans appel à close().
  await page.evaluate(() => document.getElementById('outlet')!.remove());
  expect(await page.evaluate(() => (window as unknown as { closeReason: string }).closeReason)).toBe('detached');
  expect(await leaks(page)).toEqual(baseline);
});

test('instances simultanées : une seule modale ouverte à la fois', async ({ page }) => {
  await openSection(page, 't1');
  const reasons = await page.evaluate(async () => {
    const w = window as unknown as { URR: { createReader(): { open(s: unknown): Promise<void>; isOpen: boolean; destroy(): void } }; reader: { isOpen: boolean }; events: { type: string; e: { reason?: string } }[] };
    const other = w.URR.createReader();
    await other.open({ type: 'text', text: 'Autre lecteur.' });
    const result = { firstOpen: w.reader.isOpen, secondOpen: other.isOpen, closes: w.events.filter((x) => x.type === 'close').map((x) => x.e.reason) };
    other.destroy();
    return result;
  });
  expect(reasons).toEqual({ firstOpen: false, secondOpen: true, closes: ['superseded'] });
  await expect(page.locator('urr-reader')).toHaveCount(0);
});

test('open() pendant l’ouverture remplace le contenu sans rouvrir', async ({ page }) => {
  await openSection(page, 't1');
  await page.evaluate(() => (window as unknown as { reader: { open(s: unknown, o: unknown): Promise<void> } }).reader.open({ type: 'text', text: 'Un deux trois quatre.' }, { title: 'Remplacé', startAt: 2 }));
  await expect(page.locator('urr-reader h2')).toHaveText('Remplacé');
  await expect(page.locator('urr-reader .word')).toHaveText('trois');
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');
  // Le focus revient au déclencheur d'origine.
  await expect(page.locator('#t1')).toBeFocused();
});

test('événements : séquence open → play → pause → complete → close', async ({ page }) => {
  await page.evaluate(async () => {
    const r = (window as unknown as { reader: { open(s: unknown): Promise<void>; setSpeed(n: number): void; play(): void } }).reader;
    r.setSpeed(900);
    await r.open({ type: 'text', text: 'Un deux trois.' });
    r.play();
  });
  await expect.poll(async () => (await state(page)).status).toBe('complete');
  await page.keyboard.press('Escape');
  const types = await page.evaluate(() => (window as unknown as { events: { type: string }[] }).events.map((e) => e.type));
  expect(types).toEqual(['settings-change', 'open', 'play', 'complete', 'close']);
});
