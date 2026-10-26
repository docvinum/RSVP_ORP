import { describe, expect, it, vi } from 'vitest';
import { createReader } from '../../src/api/reader';
import { DEFAULT_STORAGE_KEY, parsePreferences, type StorageLike } from '../../src/api/preferences';
import { ReaderError } from '../../src/core/errors';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  writes = 0;
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.writes++;
    this.data.set(k, v);
  }
}

describe('API — réglages et événements (sans DOM)', () => {
  it('expose l’état initial', () => {
    const reader = createReader();
    expect(reader.getState()).toMatchObject({ status: 'closed', isOpen: false, position: null, speed: 250 });
    expect(reader.getSettings().profile).toBe('standard');
  });

  it('settings-change est typé, émis une fois par changement effectif', () => {
    const reader = createReader();
    const spy = vi.fn();
    const off = reader.on('settings-change', spy);
    reader.updateSettings({ profile: 'fast' });
    reader.updateSettings({ profile: 'fast' }); // sans effet
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toMatchObject({ changed: ['profile', 'speed', 'timing'], source: 'api', settings: { speed: 400 } });
    off();
    reader.updateSettings({ profile: 'comfort' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('once ne notifie qu’une fois', () => {
    const reader = createReader();
    const spy = vi.fn();
    reader.once('settings-change', spy);
    reader.setSpeed(300);
    reader.setSpeed(325);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('setSpeed borne et ne change pas le profil', () => {
    const reader = createReader({ settings: { profile: 'comfort' } });
    expect(reader.setSpeed(10_000)).toBe(900);
    expect(reader.getSettings()).toMatchObject({ profile: 'comfort', speed: 900 });
    expect(reader.getState().speed).toBe(900);
  });

  it('getSettings retourne une copie', () => {
    const reader = createReader();
    const s = reader.getSettings();
    s.speed = 1;
    s.appearance.fontSize = 1;
    expect(reader.getSettings().speed).toBe(250);
    expect(reader.getSettings().appearance.fontSize).toBe(48);
  });

  it('open rejette ENVIRONMENT hors navigateur et émet error', async () => {
    const reader = createReader();
    const errors: ReaderError[] = [];
    reader.on('error', ({ error }) => errors.push(error));
    await expect(reader.open({ type: 'text', text: 'Bonjour' })).rejects.toMatchObject({ code: 'ENVIRONMENT' });
    expect(errors[0]?.code).toBe('ENVIRONMENT');
  });

  it('destroy est idempotent ; open rejette ensuite DESTROYED', async () => {
    const reader = createReader();
    reader.destroy();
    reader.destroy();
    expect(reader.getState().status).toBe('destroyed');
    await expect(reader.open({ type: 'text', text: 'x' })).rejects.toBeInstanceOf(ReaderError);
    await expect(reader.open({ type: 'text', text: 'x' })).rejects.toMatchObject({ code: 'DESTROYED' });
    reader.play();
    reader.close();
  });
});

describe('API — préférences', () => {
  it('par défaut, n’écrit jamais dans le stockage', () => {
    const storage = new MemoryStorage();
    const g = globalThis as { localStorage?: StorageLike };
    g.localStorage = storage;
    try {
      const reader = createReader();
      reader.updateSettings({ profile: 'fast', appearance: { fontSize: 60 } });
      reader.setSpeed(500);
      expect(storage.writes).toBe(0);
    } finally {
      delete g.localStorage;
    }
  });

  it('persiste et recharge les réglages avec une clé configurable et un schéma versionné', () => {
    const storage = new MemoryStorage();
    const a = createReader({ persistence: { enabled: true, storage, storageKey: 'app:rsvp' } });
    a.updateSettings({ profile: 'comfort', appearance: { orpColor: '#1565c0' } });
    const raw = JSON.parse(storage.getItem('app:rsvp')!);
    expect(raw.version).toBe(1);
    expect(Object.keys(raw)).toEqual(['version', 'settings']);
    expect(JSON.stringify(raw)).not.toMatch(/text|content|history|position/i);
    const b = createReader({ persistence: { enabled: true, storage, storageKey: 'app:rsvp' } });
    expect(b.getSettings()).toMatchObject({ profile: 'comfort', speed: 200, appearance: { orpColor: '#1565c0' } });
    expect(storage.getItem(DEFAULT_STORAGE_KEY)).toBeNull();
  });

  it('les erreurs de stockage sont non bloquantes', () => {
    const broken: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const errors: ReaderError[] = [];
    const reader = createReader({ persistence: { enabled: true, storage: broken } });
    reader.on('error', ({ error }) => errors.push(error));
    expect(() => reader.updateSettings({ profile: 'fast' })).not.toThrow();
    expect(reader.getSettings().profile).toBe('fast');
    expect(errors[0]).toMatchObject({ code: 'STORAGE', fatal: false });
  });

  it('l’hôte peut fournir et récupérer les préférences', () => {
    const a = createReader();
    a.updateSettings({ timing: { comma: 2.5 } });
    const prefs = a.getPreferences();
    const b = createReader({ preferences: prefs });
    expect(b.getSettings()).toEqual(a.getSettings());
    const c = createReader();
    expect(c.setPreferences(JSON.stringify(prefs))).toBe(true);
    expect(c.getSettings().timing.comma).toBe(2.5);
    expect(c.setPreferences({ version: 99 } as never)).toBe(false);
    expect(c.setPreferences('{oops')).toBe(false);
  });

  it('les préférences invalides sont bornées', () => {
    expect(parsePreferences({ version: 1, settings: { speed: 5, appearance: { fontSize: 1000 } } })).toMatchObject({ speed: 150, appearance: { fontSize: 96 } });
  });
});
