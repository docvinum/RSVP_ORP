import { expect, type Page } from '@playwright/test';

export const FIXTURE = '/tests/e2e/fixtures/index.html';

/**
 * Instrumentation injectée avant tout script : compte les minuteries,
 * écouteurs globaux, écouteurs matchMedia et observateurs actifs, et
 * enregistre les requêtes réseau. Sert aux tests de fuite.
 */
export async function instrument(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const timers = new Set<number>();
    const origSet = window.setTimeout.bind(window);
    const origClear = window.clearTimeout.bind(window);
    window.setTimeout = ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      const id = origSet(() => {
        timers.delete(id);
        if (typeof fn === 'function') (fn as (...a: unknown[]) => void)(...args);
      }, ms);
      timers.add(id);
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (id !== undefined) timers.delete(id);
      origClear(id);
    }) as typeof window.clearTimeout;

    const listeners = new Map<string, number>();
    const track = (target: EventTarget, name: string) => {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      const keys = new WeakMap<object, Set<string>>();
      target.addEventListener = (type: string, l: EventListenerOrEventListenerObject | null, o?: boolean | AddEventListenerOptions) => {
        if (l) {
          const set = keys.get(l) ?? new Set<string>();
          const key = `${type}|${typeof o === 'object' ? !!o.capture : !!o}`;
          if (!set.has(key)) {
            set.add(key);
            keys.set(l, set);
            listeners.set(name, (listeners.get(name) ?? 0) + 1);
            const signal = typeof o === 'object' ? o.signal : undefined;
            signal?.addEventListener('abort', () => {
              if (set.delete(key)) listeners.set(name, (listeners.get(name) ?? 0) - 1);
            });
          }
        }
        add(type, l, o);
      };
      target.removeEventListener = (type: string, l: EventListenerOrEventListenerObject | null, o?: boolean | EventListenerOptions) => {
        if (l) {
          const key = `${type}|${typeof o === 'object' ? !!o.capture : !!o}`;
          if (keys.get(l)?.delete(key)) listeners.set(name, (listeners.get(name) ?? 0) - 1);
        }
        remove(type, l, o);
      };
    };
    track(window, 'window');
    track(document, 'document');
    const origMatch = window.matchMedia.bind(window);
    window.matchMedia = (q: string) => {
      const mql = origMatch(q);
      track(mql, 'matchMedia');
      return mql;
    };
    let observers = 0;
    const RO = window.ResizeObserver;
    window.ResizeObserver = class extends RO {
      private live = false;
      override observe(t: Element, o?: ResizeObserverOptions) {
        if (!this.live) observers++;
        this.live = true;
        super.observe(t, o);
      }
      override disconnect() {
        if (this.live) observers--;
        this.live = false;
        super.disconnect();
      }
    };
    w.__leaks = () => ({
      timers: timers.size,
      window: listeners.get('window') ?? 0,
      document: listeners.get('document') ?? 0,
      matchMedia: listeners.get('matchMedia') ?? 0,
      observers,
    });
  });
}

export async function gotoFixture(page: Page): Promise<void> {
  await page.goto(FIXTURE);
  await page.waitForFunction(() => (window as unknown as { ready?: boolean }).ready === true);
}

export const dialog = (page: Page) => page.locator('urr-reader dialog');

export async function openSection(page: Page, id: 't1' | 't2' = 't1'): Promise<void> {
  await page.locator(`#${id}`).click();
  await expect(dialog(page)).toBeVisible();
}

export function state(page: Page) {
  return page.evaluate(() => (window as unknown as { reader: { getState(): Record<string, unknown> & { position: { index: number; total: number } | null } } }).reader.getState());
}

/** Centre horizontal de la lettre ORP et de l'axe de fixation. */
export function orpGeometry(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector('urr-reader')!.shadowRoot!;
    const pivot = root.querySelector('.word .pivot')!.getBoundingClientRect();
    const stage = root.querySelector('.stage')!.getBoundingClientRect();
    const word = root.querySelector('.word')!.getBoundingClientRect();
    const guide = root.querySelector('.guide.top')!.getBoundingClientRect();
    return {
      pivotCenter: pivot.left + pivot.width / 2,
      axis: stage.left + stage.width * 0.38,
      guideCenter: guide.left + guide.width / 2,
      wordLeft: word.left,
      wordRight: word.right,
      stageLeft: stage.left,
      stageRight: stage.right,
      text: root.querySelector('.word')!.textContent,
    };
  });
}
