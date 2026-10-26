/** Utilitaires de couleur (WCAG 2.x), sans dépendance au DOM. */

export function parseHex(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)];
}

export function toHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Retourne `color` si son contraste avec `background` atteint `minRatio`,
 * sinon la couleur la plus proche (même teinte, assombrie ou éclaircie)
 * l'atteignant. Utilisé pour garantir la lisibilité de la lettre ORP
 * (3:1, texte gras de grande taille) quelle que soit la couleur choisie.
 */
export function ensureContrast(color: string, background: string, minRatio = 3): string {
  if (contrastRatio(color, background) >= minRatio) return color;
  const target: [number, number, number] = relativeLuminance(background) > 0.5 ? [0, 0, 0] : [255, 255, 255];
  const base = parseHex(color);
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const mixed = toHex(base.map((c, i) => c + (target[i]! - c) * t) as [number, number, number]);
    if (contrastRatio(mixed, background) >= minRatio) return mixed;
  }
  return toHex(target);
}
