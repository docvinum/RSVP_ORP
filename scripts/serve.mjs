// Serveur statique minimal (sans dépendance) pour les démonstrateurs et les tests E2E.
// Outil de développement : écoute en local uniquement et ne sert que des fichiers
// situés réellement sous la racine du dépôt (liens symboliques compris).
import { createServer } from 'node:http';
import { createReadStream, realpathSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// SERVE_ROOT : racine alternative (tests du serveur).
const root = realpathSync(resolve(process.env.SERVE_ROOT ?? fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

/** Vrai si `path` est la racine ou un de ses descendants (et non un dossier voisin au même préfixe). */
function isInside(path) {
  const rel = relative(root, path);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

/** Résout l'URL en chemin de fichier sûr, ou retourne un code d'erreur HTTP. */
function resolveRequest(rawUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(rawUrl ?? '/', 'http://localhost').pathname);
  } catch {
    return { status: 400 };
  }
  if (pathname.includes('\0')) return { status: 400 };
  let path = resolve(join(root, pathname));
  if (!isInside(path)) return { status: 403 };
  try {
    if (statSync(path).isDirectory()) path = join(path, 'index.html');
    path = realpathSync(path);
  } catch {
    return { status: 404 };
  }
  if (!isInside(path)) return { status: 403 };
  try {
    if (!statSync(path).isFile()) return { status: 404 };
  } catch {
    return { status: 404 };
  }
  return { status: 200, path };
}

const server = createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' }).end();
    return;
  }
  const result = resolveRequest(req.url);
  if (result.status !== 200) {
    res.writeHead(result.status, { 'content-type': 'text/plain; charset=utf-8' }).end(String(result.status));
    return;
  }
  res.writeHead(200, {
    'content-type': types[extname(result.path)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(result.path)
    .on('error', () => res.destroy())
    .pipe(res);
});

server.on('clientError', (_error, socket) => socket.destroy());
server.listen(port, host, () => console.log(`http://${host}:${port}/`));
