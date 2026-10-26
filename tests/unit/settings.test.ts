import { describe, expect, it } from 'vitest';
import {
  PROFILES,
  SPEED,
  TIMING_PRESETS,
  applySettingsPatch,
  clampSpeed,
  createDefaultSettings,
  normalizeSettings,
  normalizeColor,
} from '../../src/core/settings';

describe('vitesse', () => {
  it('est bornée à [150, 900] et arrondie au pas de 25', () => {
    expect(SPEED).toMatchObject({ min: 150, max: 900, default: 250, step: 25 });
    expect(clampSpeed(100)).toBe(150);
    expect(clampSpeed(5000)).toBe(900);
    expect(clampSpeed(362)).toBe(350);
    expect(clampSpeed(363)).toBe(375);
    expect(clampSpeed(Number.NaN)).toBe(250);
    expect(clampSpeed('400')).toBe(250);
  });
});

describe('profils', () => {
  it('ont les valeurs produit attendues et sont immuables', () => {
    expect(PROFILES.comfort).toEqual({ speed: 200, timingLevel: 'strong' });
    expect(PROFILES.standard).toEqual({ speed: 250, timingLevel: 'normal' });
    expect(PROFILES.fast).toEqual({ speed: 400, timingLevel: 'light' });
    expect(Object.isFrozen(PROFILES.comfort)).toBe(true);
    expect(Object.isFrozen(TIMING_PRESETS.normal)).toBe(true);
    expect(() => {
      (PROFILES.comfort as { speed: number }).speed = 999;
    }).toThrow();
  });

  it('le défaut est Standard sans accélération', () => {
    const s = createDefaultSettings();
    expect(s).toMatchObject({ profile: 'standard', speed: 250, timingLevel: 'normal' });
    expect(s.acceleration.enabled).toBe(false);
    expect(s.appearance.orpColor).toBe('#d32f2f');
  });

  it('sélectionner un profil charge ses valeurs', () => {
    const { settings, changed } = applySettingsPatch(createDefaultSettings(), { profile: 'comfort' });
    expect(settings).toMatchObject({ profile: 'comfort', speed: 200, timingLevel: 'strong' });
    expect(settings.timing).toEqual(TIMING_PRESETS.strong);
    expect(changed).toEqual(['profile', 'speed', 'timing']);
  });

  it('modifier pauses ou accélération bascule vers Personnalisé', () => {
    const base = applySettingsPatch(createDefaultSettings(), { profile: 'fast' }).settings;
    expect(applySettingsPatch(base, { timing: { comma: 2 } }).settings.profile).toBe('custom');
    expect(applySettingsPatch(base, { timingLevel: 'strong' }).settings).toMatchObject({ profile: 'custom', timingLevel: 'strong' });
    expect(applySettingsPatch(base, { acceleration: { enabled: true } }).settings.profile).toBe('custom');
  });

  it('une modification sans effet ne bascule pas', () => {
    const base = createDefaultSettings();
    const r = applySettingsPatch(base, { timingLevel: 'normal', timing: { comma: 1.5 } });
    expect(r.settings.profile).toBe('standard');
    expect(r.changed).toEqual([]);
  });

  it('vitesse et apparence ne changent pas le profil', () => {
    const base = createDefaultSettings();
    const r = applySettingsPatch(base, { speed: 475, appearance: { fontSize: 60, orpColor: '#00F' } });
    expect(r.settings).toMatchObject({ profile: 'standard', speed: 475 });
    expect(r.settings.appearance).toMatchObject({ fontSize: 60, orpColor: '#0000ff' });
    expect(r.changed).toEqual(['speed', 'appearance']);
  });

  it('ne modifie jamais les réglages d’origine', () => {
    const base = createDefaultSettings();
    const snapshot = JSON.stringify(base);
    applySettingsPatch(base, { profile: 'comfort', timing: { comma: 3 }, appearance: { fontSize: 30 } });
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it('les coefficients personnalisés font passer le niveau à custom', () => {
    const r = applySettingsPatch(createDefaultSettings(), { timing: { sentence: 3.1 } });
    expect(r.settings.timingLevel).toBe('custom');
  });
});

describe('validation', () => {
  it('borne toutes les valeurs', () => {
    const s = normalizeSettings({
      profile: 'nope',
      speed: 10_000,
      timing: { comma: 100, longWordThreshold: 1, longWordStep: -1 },
      acceleration: { enabled: true, startSpeed: 600, targetSpeed: 300, duration: 0 },
      appearance: { fontSize: 2, fontFamily: 'Comic Sans', orpColor: 'red; background:url(x)', theme: 'neon' },
    });
    expect(s.speed).toBe(900);
    expect(s.timing).toMatchObject({ comma: 4, longWordThreshold: 4, longWordStep: 0 });
    expect(s.acceleration).toMatchObject({ startSpeed: 600, targetSpeed: 600, duration: 5 });
    expect(s.appearance).toEqual({ fontSize: 24, fontFamily: 'sans', orpColor: '#d32f2f', showGuides: true, theme: 'auto' });
    // accélération activée => le profil standard demandé par défaut devient custom
    expect(s.profile).toBe('custom');
  });

  it('accepte des entrées non objet', () => {
    expect(normalizeSettings(null)).toEqual(createDefaultSettings());
    expect(normalizeSettings('x')).toEqual(createDefaultSettings());
  });

  it('normalise les couleurs', () => {
    expect(normalizeColor('#ABC')).toBe('#aabbcc');
    expect(normalizeColor('rgb(0,0,0)')).toBe('#d32f2f');
  });
});
