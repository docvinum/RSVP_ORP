import { describe, expect, it } from 'vitest';
import { contrastRatio, ensureContrast } from '../../src/core/color';
import { computePlacement } from '../../src/ui/orp-layout';
import { STAGE_BACKGROUNDS } from '../../src/ui/styles';
import { ORP_PRESET_COLORS } from '../../src/ui/settings-panel';
import { DEFAULT_ORP_COLOR } from '../../src/core/settings';

describe('placement ORP (calcul)', () => {
  it('place le centre de la lettre ORP sur l’axe', () => {
    const p = computePlacement({ stageWidth: 800, axisX: 304, beforeWidth: 40, pivotWidth: 20, afterWidth: 100 });
    expect(p.scale).toBe(1);
    expect(p.offsetX + 40 + 20 / 2).toBe(304);
  });

  it('réduit la police d’un mot trop long sans déplacer l’axe', () => {
    const input = { stageWidth: 400, axisX: 152, beforeWidth: 60, pivotWidth: 20, afterWidth: 400, padding: 8 };
    const p = computePlacement(input);
    expect(p.scale).toBeLessThan(1);
    const center = p.offsetX + (input.beforeWidth + input.pivotWidth / 2) * p.scale;
    expect(center).toBeCloseTo(152, 6);
    const rightEdge = p.offsetX + (60 + 20 + 400) * p.scale;
    expect(rightEdge).toBeLessThanOrEqual(400 - 8 + 1e-6);
  });

  it('borne la réduction', () => {
    const p = computePlacement({ stageWidth: 100, axisX: 38, beforeWidth: 10, pivotWidth: 10, afterWidth: 5000, minScale: 0.4 });
    expect(p.scale).toBe(0.4);
  });
});

describe('contraste ORP', () => {
  it('le rouge par défaut est lisible sur les deux thèmes', () => {
    expect(contrastRatio(DEFAULT_ORP_COLOR, STAGE_BACKGROUNDS.light)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(DEFAULT_ORP_COLOR, STAGE_BACKGROUNDS.dark)).toBeGreaterThanOrEqual(3);
  });

  it('ajuste une couleur insuffisamment contrastée', () => {
    const fixed = ensureContrast('#ffff00', STAGE_BACKGROUNDS.light, 3);
    expect(fixed).not.toBe('#ffff00');
    expect(contrastRatio(fixed, STAGE_BACKGROUNDS.light)).toBeGreaterThanOrEqual(3);
    const dark = ensureContrast('#000080', STAGE_BACKGROUNDS.dark, 3);
    expect(contrastRatio(dark, STAGE_BACKGROUNDS.dark)).toBeGreaterThanOrEqual(3);
    expect(ensureContrast('#d32f2f', '#ffffff')).toBe('#d32f2f');
  });

  it('les couleurs proposées sont lisibles sur fond clair', () => {
    for (const c of ORP_PRESET_COLORS) expect(contrastRatio(c, STAGE_BACKGROUNDS.light)).toBeGreaterThanOrEqual(3);
  });
});
