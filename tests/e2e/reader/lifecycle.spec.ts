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

test.describe('réentrance et ouvertures interrompues', () => {
  type W = { URR: { createReader(o?: unknown): R }; reader: R; events: { type: string; e: { reason?: string } }[] };
  type R = {
    open(s: unknown, o?: unknown): Promise<void>;
    close(): void;
    destroy(): void;
    on(t: string, f: (e: { reason?: string; error?: { code: string } }) => void): () => void;
    updateSettings(p: unknown): void;
    play(): void;
    getState(): { status: string; isOpen: boolean; speed: number; accelerating: boolean; position: { index: number } | null };
    getDocument(): unknown;
    isOpen: boolean;
  };

  const openDialogs = (page: Page) =>
    page.evaluate(() => [...document.querySelectorAll('urr-reader')].filter((el) => el.shadowRoot?.querySelector('dialog')?.open).length);

  test('rouvrir A depuis son événement close pendant l’ouverture de B : une seule modale', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      const A = w.reader;
      await A.open({ type: 'text', text: 'Lecteur A.' });
      let reopened = false;
      A.on('close', (e) => {
        if (e.reason === 'superseded' && !reopened) {
          reopened = true;
          void A.open({ type: 'text', text: 'Lecteur A rouvert.' });
        }
      });
      const B = w.URR.createReader();
      let code = 'none';
      try {
        await B.open({ type: 'text', text: 'Lecteur B.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      return { code, a: A.isOpen, b: B.isOpen, elements: document.querySelectorAll('urr-reader').length };
    });
    expect(result).toEqual({ code: 'ABORTED', a: true, b: false, elements: 1 });
    expect(await openDialogs(page)).toBe(1);
    await expect(page.locator('urr-reader .fulltext')).toHaveText('Lecteur A rouvert.');
  });

  test('destroy() au premier progress : lecteur détruit, rien ne reste monté', async ({ page }) => {
    const baseline = await leaks(page);
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      const r = w.URR.createReader();
      r.on('progress', () => r.destroy());
      let code = 'none';
      try {
        await r.open({ type: 'text', text: 'Un deux trois.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      r.destroy();
      return { code, state: r.getState(), elements: document.querySelectorAll('urr-reader').length };
    });
    expect(result.code).toBe('ABORTED');
    expect(result.state).toMatchObject({ status: 'destroyed', isOpen: false });
    expect(result.elements).toBe(0);
    expect(await leaks(page)).toEqual(baseline);
  });

  test('close() pendant l’ouverture : rejet ABORTED, ni open ni close émis', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      const off = w.reader.on('progress', () => w.reader.close());
      let code = 'none';
      try {
        await w.reader.open({ type: 'text', text: 'Un deux trois.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      off();
      return { code, isOpen: w.reader.isOpen, doc: w.reader.getDocument(), types: w.events.map((x) => x.type), elements: document.querySelectorAll('urr-reader').length };
    });
    expect(result).toEqual({ code: 'ABORTED', isOpen: false, doc: null, types: ['error'], elements: 0 });
    // Le lecteur reste utilisable.
    await openSection(page);
  });

  test('nom de composant déjà pris : échec ENVIRONMENT sans état partiel', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      customElements.define('urr-conflict', class extends HTMLElement {});
      const r = w.URR.createReader({ tagName: 'urr-conflict' });
      const errors: string[] = [];
      r.on('error', (e) => errors.push(e.error!.code));
      let code = 'none';
      try {
        await r.open({ type: 'text', text: 'Bonjour.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      return { code, errors, doc: r.getDocument(), state: r.getState().status, elements: document.querySelectorAll('urr-conflict').length };
    });
    expect(result).toEqual({ code: 'ENVIRONMENT', errors: ['ENVIRONMENT'], doc: null, state: 'closed', elements: 0 });
  });

  test('échec de showModal() : ReaderError, événement error, rien de monté, réessai possible', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      const original = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function () {
        throw new DOMException('refusé', 'InvalidStateError');
      };
      const errors: string[] = [];
      const off = w.reader.on('error', (e) => errors.push(e.error!.code));
      let name = '';
      let code = '';
      try {
        await w.reader.open({ type: 'text', text: 'Bonjour.' });
      } catch (e) {
        name = (e as Error).name;
        code = (e as { code: string }).code;
      } finally {
        HTMLDialogElement.prototype.showModal = original;
      }
      off();
      const after = { doc: w.reader.getDocument(), isOpen: w.reader.isOpen, elements: document.querySelectorAll('urr-reader').length };
      await w.reader.open({ type: 'text', text: 'Deuxième essai.' });
      return { name, code, errors, after, retry: w.reader.isOpen };
    });
    expect(result).toEqual({ name: 'ReaderError', code: 'ENVIRONMENT', errors: ['ENVIRONMENT'], after: { doc: null, isOpen: false, elements: 0 }, retry: true });
  });

  test('startAt invalide : premier mot ; décimal : tronqué', async ({ page }) => {
    const nan = await page.evaluate(async () => {
      const w = window as unknown as W;
      await w.reader.open({ type: 'text', text: 'un deux trois' }, { startAt: Number.NaN });
      return w.reader.getState().position?.index;
    });
    expect(nan).toBe(0);
    await expect(page.locator('urr-reader .word')).toHaveText('un');
    await page.evaluate(() => (window as unknown as W).reader.open({ type: 'text', text: 'un deux trois' }, { startAt: 1.5 }));
    await expect(page.locator('urr-reader .word')).toHaveText('deux');
  });

  test('patch vitesse + pauses pendant l’accélération : la vitesse manuelle l’emporte', async ({ page }) => {
    const state = await page.evaluate(async () => {
      const w = window as unknown as W;
      w.reader.updateSettings({ acceleration: { enabled: true, startSpeed: 300, targetSpeed: 600, duration: 60 } });
      await w.reader.open({ type: 'text', text: Array.from({ length: 300 }, (_, i) => `mot${i}`).join(' ') });
      w.reader.play();
      await new Promise((r) => setTimeout(r, 400));
      const before = w.reader.getState().accelerating;
      w.reader.updateSettings({ speed: 500, timing: { comma: 2 } });
      return { before, after: w.reader.getState() };
    });
    expect(state.before).toBe(true);
    expect(state.after).toMatchObject({ speed: 500, accelerating: false });
  });
});

test.describe('réentrance via le focus et pendant un remplacement', () => {
  type R = {
    open(s: unknown, o?: unknown): Promise<void>;
    close(): void;
    on(t: string, f: (e: { reason?: string }) => void): () => void;
    updateSettings(p: unknown): void;
    play(): void;
    getState(): { isOpen: boolean; speed: number; accelerating: boolean };
    getDocument(): unknown;
    isOpen: boolean;
  };
  type W = { URR: { createReader(o?: unknown): R }; reader: R; events: { type: string }[] };

  test('close() depuis un focusin déclenché par showModal() : ouverture annulée, rien de monté', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      let done = false;
      const handler = () => {
        if (!done && document.querySelector('urr-reader')) {
          done = true;
          w.reader.close();
        }
      };
      document.addEventListener('focusin', handler);
      let code = 'none';
      try {
        await w.reader.open({ type: 'text', text: 'Un deux trois.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      document.removeEventListener('focusin', handler);
      return { code, triggered: done, isOpen: w.reader.isOpen, doc: w.reader.getDocument(), elements: document.querySelectorAll('urr-reader').length };
    });
    expect(result).toEqual({ code: 'ABORTED', triggered: true, isOpen: false, doc: null, elements: 0 });
    await openSection(page);
  });

  test('rouvrir depuis le focus restauré à la fermeture : la nouvelle ouverture subsiste', async ({ page }) => {
    await openSection(page, 't1');
    await page.evaluate(() => {
      const w = window as unknown as W;
      const trigger = document.getElementById('t1')!;
      const handler = () => {
        trigger.removeEventListener('focus', handler);
        void w.reader.open({ type: 'text', text: 'Rouvert depuis le focus.' });
      };
      trigger.addEventListener('focus', handler);
    });
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeVisible();
    await expect(page.locator('urr-reader .fulltext')).toHaveText('Rouvert depuis le focus.');
    const state = await page.evaluate(() => {
      const w = window as unknown as W;
      return { isOpen: w.reader.isOpen, elements: document.querySelectorAll('urr-reader').length, last: w.events.slice(-2).map((e) => e.type) };
    });
    expect(state).toEqual({ isOpen: true, elements: 1, last: ['close', 'open'] });
  });

  test('B.close() depuis l’événement close de A pendant B.open() : B ne s’ouvre pas', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const w = window as unknown as W;
      await w.reader.open({ type: 'text', text: 'Lecteur A.' });
      const B = w.URR.createReader();
      w.reader.on('close', () => B.close());
      let code = 'none';
      try {
        await B.open({ type: 'text', text: 'Lecteur B.' });
      } catch (e) {
        code = (e as { code: string }).code;
      }
      return { code, a: w.reader.isOpen, b: B.isOpen, doc: B.getDocument(), elements: document.querySelectorAll('urr-reader').length };
    });
    expect(result).toEqual({ code: 'ABORTED', a: false, b: false, doc: null, elements: 0 });
  });

  test('réaffirmer la vitesse stockée arrête l’accélération', async ({ page }) => {
    const state = await page.evaluate(async () => {
      const w = window as unknown as W;
      w.reader.updateSettings({ acceleration: { enabled: true, startSpeed: 300, targetSpeed: 600, duration: 60 } });
      await w.reader.open({ type: 'text', text: Array.from({ length: 300 }, (_, i) => `mot${i}`).join(' ') });
      w.reader.play();
      await new Promise((r) => setTimeout(r, 300));
      const before = w.reader.getState();
      w.reader.updateSettings({ speed: 250, timing: { comma: 2 } });
      const afterCombined = w.reader.getState();
      w.reader.updateSettings({ acceleration: { duration: 90 } });
      const rearmed = w.reader.getState().accelerating;
      w.reader.updateSettings({ speed: 250 });
      return { before: before.accelerating, afterCombined, rearmed, afterSpeedOnly: w.reader.getState() };
    });
    expect(state.before).toBe(true);
    expect(state.afterCombined).toMatchObject({ speed: 250, accelerating: false });
    expect(state.rearmed).toBe(true);
    expect(state.afterSpeedOnly).toMatchObject({ speed: 250, accelerating: false });
  });
});

test.describe('régressions de ddcd718', () => {
  type R = {
    open(s: unknown): Promise<void>;
    close(): void;
    destroy(): void;
    play(): void;
    setSpeed(n: number): number;
    on(t: string, f: () => void): () => void;
    updateSettings(p: unknown): void;
    getState(): { status: string; isOpen: boolean; speed: number; accelerating: boolean };
  };
  type W = { URR: { createReader(o?: unknown): R } };

  for (const event of ['close', 'pause'] as const) {
    test(`destroy() depuis « ${event} » pendant la fermeture : aucun élément résiduel`, async ({ page }) => {
      const baseline = await leaks(page);
      const result = await page.evaluate(async (event) => {
        const r = (window as unknown as W).URR.createReader();
        await r.open({ type: 'text', text: 'Un deux trois quatre cinq six sept huit.' });
        r.play();
        r.on(event, () => r.destroy());
        r.close();
        return { status: r.getState().status, elements: document.querySelectorAll('urr-reader').length };
      }, event);
      expect(result).toEqual({ status: 'destroyed', elements: 0 });
      expect(await leaks(page)).toEqual(baseline);
    });
  }

  test('setSpeed() avec la vitesse stockée après une accélération terminée', async ({ page }) => {
    test.setTimeout(30_000);
    const state = await page.evaluate(async () => {
      const r = (window as unknown as W).URR.createReader();
      r.updateSettings({ acceleration: { enabled: true, startSpeed: 300, targetSpeed: 600, duration: 5 } });
      await r.open({ type: 'text', text: Array.from({ length: 2000 }, (_, i) => `mot${i}`).join(' ') });
      r.play();
      await new Promise((res) => setTimeout(res, 5600));
      const ended = r.getState();
      const applied = r.setSpeed(250);
      const after = r.getState();
      r.destroy();
      return { ended, applied, after };
    });
    expect(state.ended).toMatchObject({ speed: 600, accelerating: false });
    expect(state.applied).toBe(250);
    expect(state.after).toMatchObject({ speed: 250, accelerating: false });
  });
});
