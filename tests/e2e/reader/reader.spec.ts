import { expect, test } from '@playwright/test';
import { dialog, gotoFixture, instrument, openSection, state } from '../helpers';

test.beforeEach(async ({ page }) => {
  await instrument(page);
  await gotoFixture(page);
});

test.describe('ouverture et contenu', () => {
  test('ouvre un dialogue modal nommé sur la bonne section, focus sur Lecture', async ({ page }) => {
    await openSection(page, 't1');
    const d = dialog(page);
    await expect(d).toHaveAttribute('aria-labelledby', 'urr-title');
    await expect(page.locator('urr-reader h2')).toHaveText('Première section');
    await expect(page.getByRole('dialog', { name: 'Première section' })).toBeVisible();
    await expect(page.locator('urr-reader button[data-action="toggle"]')).toBeFocused();
    await expect(page.locator('urr-reader .fulltext')).toContainText('Bonjour, voici un texte de démonstration.');
    await expect(page.locator('urr-reader .fulltext')).not.toContainText('Lecture rapide');
    await expect(page.locator('urr-reader .word')).toHaveText('Première');
  });

  test('plusieurs boutons déclencheurs ouvrent chacun leur section', async ({ page }) => {
    await openSection(page, 't1');
    await page.keyboard.press('Escape');
    await openSection(page, 't2');
    await expect(page.locator('urr-reader .fulltext')).toContainText('The quick brown fox');
    expect((await state(page)).title).toBe('Second section');
    await expect(page.locator('urr-reader')).toHaveCount(1);
  });

  test('accepte texte, HTML et Markdown sans exécuter le contenu', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.evaluate(() => {
      const r = (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader;
      return r.open({ type: 'html', html: '<h1>HTML</h1><p>Texte <b>gras</b>.</p><img src="https://example.invalid/x.png" onerror="window.__pwned=1"><script>window.__pwned=1</script>' });
    });
    await expect(page.locator('urr-reader .fulltext')).toHaveText(/HTML\s*Texte gras\./);
    await expect(page.locator('urr-reader .fulltext b, urr-reader .fulltext img, urr-reader .fulltext script')).toHaveCount(0);
    await page.evaluate(() => (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader.open({ type: 'markdown', markdown: '# Titre MD\n\nUn *paragraphe* [lien](https://example.com).' }));
    await expect(page.locator('urr-reader .fulltext')).toHaveText(/Titre MD\s*Un paragraphe lien\./);
    await expect(page.locator('urr-reader .fulltext a')).toHaveCount(0);
    await page.evaluate(() => (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader.open({ type: 'text', text: 'Texte brut.\n\nSecond paragraphe.' }));
    await expect(page.locator('urr-reader .fulltext p')).toHaveCount(2);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    expect(requests.filter((u) => new URL(u).hostname !== '127.0.0.1')).toEqual([]);
  });

  test('rejette une source vide avec une erreur typée', async ({ page }) => {
    const code = await page.evaluate(async () => {
      const r = (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader;
      try {
        await r.open({ type: 'html', html: '<script>1</script>' });
        return 'none';
      } catch (e) {
        return (e as { code: string }).code;
      }
    });
    expect(code).toBe('EMPTY_CONTENT');
    await expect(page.locator('urr-reader')).toHaveCount(0);
  });
});

test.describe('lecture et clavier', () => {
  test('Espace lance et suspend la lecture ; la progression avance', async ({ page }) => {
    await openSection(page);
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).status).toBe('playing');
    await expect.poll(async () => (await state(page)).position!.index, { timeout: 3000 }).toBeGreaterThan(2);
    await expect(page.locator('urr-reader button[data-action="toggle"]')).toHaveAttribute('aria-label', 'Pause');
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).status).toBe('paused');
    const idx = (await state(page)).position!.index;
    await page.waitForTimeout(600);
    expect((await state(page)).position!.index).toBe(idx);
    await expect(page.locator('urr-reader [aria-live="polite"]')).toContainText('En pause');
  });

  test('navigation par mot, phrase, début et fin ; vitesse au clavier', async ({ page }) => {
    await openSection(page);
    const idx = async () => (await state(page)).position!.index;
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await idx()).toBe(2);
    await page.keyboard.press('ArrowLeft');
    expect(await idx()).toBe(1);
    await page.keyboard.press('Shift+ArrowRight');
    const firstSentence = await idx();
    expect(firstSentence).toBeGreaterThan(1);
    await page.keyboard.press('Shift+ArrowLeft');
    expect(await idx()).toBeLessThan(firstSentence);
    await page.keyboard.press('End');
    expect(await idx()).toBe((await state(page)).position!.total - 1);
    await page.keyboard.press('Home');
    expect(await idx()).toBe(0);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect((await state(page)).speed).toBe(300);
    await page.keyboard.press('ArrowDown');
    expect((await state(page)).speed).toBe(275);
    await expect(page.locator('urr-reader .speed output')).toContainText('275 mots/min');
  });

  test('les boutons de commande ont un nom accessible et une cible ≥ 44 px', async ({ page }) => {
    await openSection(page);
    for (const name of ['Phrase précédente', 'Mot précédent', 'Lecture', 'Mot suivant', 'Phrase suivante', 'Ralentir de 25 mots par minute', 'Accélérer de 25 mots par minute', 'Fermer le lecteur']) {
      const button = page.getByRole('button', { name, exact: true });
      await expect(button).toBeVisible();
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('button', { name: 'Accélérer de 25 mots par minute' }).click();
    expect((await state(page)).speed).toBe(275);
    await page.getByRole('button', { name: 'Mot suivant' }).click();
    expect((await state(page)).position!.index).toBe(1);
  });

  test('la barre de progression est un curseur accessible qui repositionne', async ({ page }) => {
    await openSection(page);
    const range = page.getByRole('slider', { name: 'Position de lecture' });
    await expect(range).toHaveAttribute('aria-valuetext', /Mot 1 sur \d+/);
    await range.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect((await state(page)).position!.index).toBe(2);
    await expect(range).toHaveAttribute('aria-valuetext', /Mot 3 sur/);
  });

  test('Échap ferme, restaure le focus et le défilement de l’hôte', async ({ page }) => {
    await page.locator('#t1').focus();
    await page.evaluate(() => window.scrollTo(0, 120));
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBe(120);
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    await page.mouse.move(10, 10);
    await page.mouse.wheel(0, 800);
    const vp = page.viewportSize()!;
    await page.mouse.move(vp.width / 2, 150);
    await page.mouse.wheel(0, 800);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await page.keyboard.press('Escape');
    await expect(page.locator('urr-reader')).toHaveCount(0);
    await expect(page.locator('#t1')).toBeFocused();
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    const events = await page.evaluate(() => (window as unknown as { events: { type: string; e: { reason?: string } }[] }).events.map((x) => `${x.type}:${x.e.reason ?? ''}`));
    expect(events).toContain('close:user');
  });

  test('les raccourcis sont inactifs lorsque le lecteur est fermé', async ({ page }) => {
    await page.locator('body').click();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    expect((await state(page)).status).toBe('closed');
    await expect(page.locator('urr-reader')).toHaveCount(0);
  });

  test('pause automatique quand l’onglet devient invisible', async ({ page }) => {
    await openSection(page);
    await page.keyboard.press('Space');
    await expect.poll(async () => (await state(page)).status).toBe('playing');
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect((await state(page)).status).toBe('paused');
    const events = await page.evaluate(() => (window as unknown as { events: { type: string; e: { reason?: string } }[] }).events.filter((x) => x.type === 'pause').map((x) => x.e.reason));
    expect(events).toEqual(['hidden']);
  });
});

test.describe('vue du texte intégral', () => {
  test('surligne le mot courant et la phrase active, synchronisés avec le moteur', async ({ page }) => {
    await openSection(page);
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
    const cur = page.locator('urr-reader .fulltext .w.cur');
    await expect(cur).toHaveCount(1);
    await expect(cur).toHaveAttribute('data-w', '5');
    await expect(cur).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('urr-reader .fulltext .s.active')).toHaveCount(1);
    await expect(page.locator('urr-reader .fulltext .s.active .w.cur')).toHaveCount(1);
    await expect(page.locator('urr-reader .word')).toHaveText((await cur.textContent())!);
  });

  test('un clic sur un mot repositionne la lecture et la laisse en pause', async ({ page }) => {
    await openSection(page);
    await page.keyboard.press('Space');
    await page.locator('urr-reader .fulltext .w', { hasText: 'anticonstitutionnellement' }).click();
    const s = await state(page);
    expect(s.status).toBe('paused');
    await expect(page.getByRole('button', { name: 'Lecture', exact: true })).toBeFocused();
    await expect(page.locator('urr-reader .word')).toHaveText('anticonstitutionnellement');
    expect(s.position!.index).toBe(Number(await page.locator('urr-reader .fulltext .w.cur').getAttribute('data-w')));
  });

  test('le défilement manuel suspend le suivi, qui peut être réactivé', async ({ page }) => {
    await page.evaluate(() => {
      const r = (window as unknown as { reader: { open(s: unknown): Promise<void> } }).reader;
      const text = Array.from({ length: 60 }, (_, i) => `Paragraphe ${i + 1}. Une phrase assez longue pour remplir plusieurs lignes de texte dans la vue intégrale du lecteur.`).join('\n\n');
      return r.open({ type: 'text', text });
    });
    const full = page.locator('urr-reader .fulltext');
    const resume = page.getByRole('button', { name: 'Reprendre le suivi' });
    await expect(resume).toBeHidden();
    // Suivi automatique : aller loin dans le texte fait défiler la vue.
    await page.evaluate(() => (window as unknown as { reader: { seek(i: number): void } }).reader.seek(400));
    await expect.poll(() => full.evaluate((el) => el.scrollTop)).toBeGreaterThan(500);
    await expect(page.locator('urr-reader .fulltext .w.cur')).toBeInViewport();
    // Défilement manuel : le suivi est suspendu.
    await full.hover();
    await page.mouse.wheel(0, -3000);
    await expect(resume).toBeVisible();
    await page.evaluate(() => (window as unknown as { reader: { seek(i: number): void } }).reader.seek(700));
    await page.waitForTimeout(300);
    await expect(page.locator('urr-reader .fulltext .w.cur')).not.toBeInViewport();
    // Réactivation.
    await resume.click();
    await expect(resume).toBeHidden();
    await expect(page.locator('urr-reader .fulltext .w.cur')).toBeInViewport();
  });

  test('le suivi ne défile pas tant que le mot reste dans la zone de confort', async ({ page }) => {
    await openSection(page);
    const full = page.locator('urr-reader .fulltext');
    const top = await full.evaluate((el) => el.scrollTop);
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    expect(await full.evaluate((el) => el.scrollTop)).toBe(top);
  });
});

test.describe('réglages', () => {
  test('profils, pauses et bascule vers Personnalisé', async ({ page }) => {
    await openSection(page);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Réglages' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Réglages', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await page.getByText('Rapide', { exact: true }).click();
    expect((await state(page)).speed).toBe(400);
    await expect(page.getByRole('radio', { name: 'Rapide' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Faibles' })).toBeChecked();
    await page.getByText('Confort', { exact: true }).click();
    expect((await state(page)).speed).toBe(200);
    await page.getByText('Normales', { exact: true }).click();
    await expect(page.getByRole('radio', { name: 'Personnalisé' })).toBeChecked();
    await page.getByText('Réglages détaillés').click();
    const comma = page.getByLabel('Virgule (×)');
    await comma.fill('2.5');
    await comma.press('Tab');
    const settings = await page.evaluate(() => (window as unknown as { reader: { getSettings(): { timing: { comma: number }; timingLevel: string; profile: string } } }).reader.getSettings());
    expect(settings).toMatchObject({ profile: 'custom', timingLevel: 'custom', timing: { comma: 2.5 } });
    await page.getByRole('button', { name: 'Rétablir les réglages par défaut' }).click();
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked();
  });

  test('l’apparence change immédiatement sans fermer la modale', async ({ page }) => {
    await openSection(page);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    const pivot = page.locator('urr-reader .word .pivot');
    await expect(pivot).toHaveCSS('color', 'rgb(211, 47, 47)');
    await page.getByRole('radio', { name: 'Vert' }).check({ force: true });
    await expect(pivot).toHaveCSS('color', 'rgb(46, 125, 50)');
    await page.getByLabel('Taille du texte').fill('72');
    await expect(page.locator('urr-reader .word')).toHaveCSS('font-size', '72px');
    await page.getByLabel('Police').selectOption('mono');
    await expect(page.locator('urr-reader .word')).toHaveCSS('font-family', /monospace/);
    await page.getByLabel('Afficher les repères de fixation').uncheck();
    await expect(page.locator('urr-reader .guide.top')).toBeHidden();
    await page.getByLabel('Thème').selectOption('dark');
    await expect(page.locator('urr-reader dialog')).toHaveCSS('background-color', 'rgb(22, 22, 22)');
    await expect(dialog(page)).toBeVisible();
  });

  test('une couleur peu contrastée est ajustée et signalée', async ({ page }) => {
    await openSection(page);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.evaluate(() => (window as unknown as { reader: { updateSettings(p: unknown): void } }).reader.updateSettings({ appearance: { orpColor: '#ffff00' } }));
    await expect(page.locator('urr-reader .word .pivot')).not.toHaveCSS('color', 'rgb(255, 255, 0)');
    await expect(page.getByText('Couleur ajustée automatiquement')).toBeVisible();
  });

  test('Échap ferme d’abord le panneau de réglages', async ({ page }) => {
    await openSection(page);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('region', { name: 'Réglages' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Réglages', exact: true })).toBeFocused();
    await expect(dialog(page)).toBeVisible();
  });

  test('accélération progressive : activable, indiquée, suspendue avec la lecture', async ({ page }) => {
    await openSection(page);
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.getByLabel('Vitesse de départ (mots/min)').fill('300');
    await page.getByLabel('Vitesse de départ (mots/min)').press('Tab');
    await page.getByLabel('Vitesse cible (mots/min)').fill('600');
    await page.getByLabel('Vitesse cible (mots/min)').press('Tab');
    await page.getByLabel('Durée de montée (s)').fill('5');
    await page.getByLabel('Durée de montée (s)').press('Tab');
    await page.getByLabel('Activer l’accélération').check();
    await expect(page.getByRole('radio', { name: 'Personnalisé' })).toBeChecked();
    expect((await state(page)).accelerating).toBe(true);
    await page.keyboard.press('Escape'); // ferme le panneau (plein écran sur mobile)
    await page.getByRole('button', { name: 'Lecture', exact: true }).click();
    await expect(page.locator('urr-reader .speed .ramp')).toBeVisible();
    await expect.poll(async () => (await state(page)).speed, { timeout: 4000 }).toBeGreaterThan(330);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = (await state(page)).speed;
    await page.waitForTimeout(800);
    expect((await state(page)).speed).toBe(paused);
  });

  test('aucune persistance par défaut', async ({ page }) => {
    await openSection(page);
    await page.keyboard.press('ArrowUp');
    await page.getByRole('button', { name: 'Réglages', exact: true }).click();
    await page.getByText('Rapide', { exact: true }).click();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
  });
});
