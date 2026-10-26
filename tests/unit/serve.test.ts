import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Serveur de démonstration (scripts/serve.mjs) : confinement et robustesse. */
const PORT = 4190 + Math.floor(Math.random() * 500);
let base: string;
let server: ChildProcess;
let announced = '';

function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    // Chemin envoyé tel quel (pas de normalisation côté client).
    const req = request({ host: '127.0.0.1', port: PORT, path, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (c: Buffer) => (body += c.toString()));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

beforeAll(async () => {
  base = mkdtempSync(join(tmpdir(), 'urr-serve-'));
  mkdirSync(join(base, 'site'));
  mkdirSync(join(base, 'site-secret'));
  writeFileSync(join(base, 'site', 'index.html'), '<p>ok</p>');
  writeFileSync(join(base, 'site-secret', 'secret.txt'), 'SENTINELLE');
  server = spawn(process.execPath, ['scripts/serve.mjs'], { env: { ...process.env, PORT: String(PORT), SERVE_ROOT: join(base, 'site') }, stdio: 'pipe' });
  await new Promise<void>((resolve, reject) => {
    server.stdout!.once('data', (d: Buffer) => {
      announced = d.toString();
      resolve();
    });
    server.once('exit', (code) => reject(new Error(`serveur arrêté (${code})`)));
  });
});

afterAll(() => {
  server?.kill();
  rmSync(base, { recursive: true, force: true });
});

describe('scripts/serve.mjs', () => {
  it('sert les fichiers de la racine', async () => {
    expect(await get('/')).toMatchObject({ status: 200, body: '<p>ok</p>' });
  });

  it('refuse un dossier voisin partageant le préfixe de la racine', async () => {
    for (const path of ['/..%2Fsite-secret%2Fsecret.txt', '/%2e%2e/site-secret/secret.txt', '/../site-secret/secret.txt']) {
      const res = await get(path);
      expect(res.body).not.toContain('SENTINELLE');
      expect([400, 403, 404]).toContain(res.status);
    }
  });

  it('répond 400 à une URL mal encodée sans s’arrêter', async () => {
    expect((await get('/%ZZ')).status).toBe(400);
    expect((await get('/')).status).toBe(200);
  });

  it('n’écoute que sur la boucle locale par défaut', () => {
    expect(announced).toContain('http://127.0.0.1:');
  });
});
