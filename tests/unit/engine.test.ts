import { describe, expect, it } from 'vitest';
import { buildDocument } from '../../src/core/document';
import { RsvpEngine, type EngineStatus } from '../../src/core/engine';
import { TIMING_PRESETS, type AccelerationSettings } from '../../src/core/settings';
import { accelerationSpeed } from '../../src/core/acceleration';
import { FakeTime } from './fake-time';

// Timing neutre : chaque mot dure exactement 60 000 / vitesse.
const FLAT = { comma: 1, clause: 1, sentence: 1, paragraph: 1, longWordThreshold: 20, longWordStep: 0, longWordMaxExtra: 0 };
const doc = (text: string) => buildDocument([{ kind: 'paragraph', text }]);
const tenWords = doc('un deux trois quatre cinq six sept huit neuf dix');

function setup(opts: { speed?: number; acceleration?: Partial<AccelerationSettings>; timing?: typeof FLAT } = {}) {
  const time = new FakeTime();
  const engine = new RsvpEngine({
    clock: time,
    timer: time,
    speed: opts.speed ?? 300, // 200 ms par mot
    timing: opts.timing ?? FLAT,
    acceleration: { enabled: false, startSpeed: 300, targetSpeed: 600, duration: 10, curve: 'linear', ...opts.acceleration },
  });
  const statuses: EngineStatus[] = [];
  const positions: number[] = [];
  engine.on('status', (e) => statuses.push(e.status));
  engine.on('position', (e) => positions.push(e.index));
  return { time, engine, statuses, positions };
}

describe('RsvpEngine — transitions', () => {
  it('suit le cycle idle → ready → playing → paused → playing → complete', () => {
    const { time, engine, statuses } = setup();
    expect(engine.getSnapshot().status).toBe('idle');
    engine.play(); // sans document : sans effet
    expect(engine.getSnapshot().status).toBe('idle');
    engine.load(tenWords);
    expect(engine.getSnapshot()).toMatchObject({ status: 'ready', index: 0, total: 10, progress: 0 });
    engine.play();
    time.advance(200 * 3);
    expect(engine.getSnapshot().index).toBe(3);
    engine.pause('user');
    time.advance(5000);
    expect(engine.getSnapshot()).toMatchObject({ status: 'paused', index: 3 });
    engine.resume();
    time.advance(200 * 20);
    expect(engine.getSnapshot()).toMatchObject({ status: 'complete', index: 9, progress: 1 });
    expect(statuses).toEqual(['ready', 'playing', 'paused', 'playing', 'complete']);
    expect(time.pending).toBe(0);
  });

  it('les appels répétés sont idempotents', () => {
    const { time, engine, statuses } = setup();
    engine.load(tenWords);
    engine.play();
    engine.play();
    expect(time.pending).toBe(1);
    engine.pause();
    engine.pause();
    engine.resume();
    engine.resume();
    expect(time.pending).toBe(1);
    expect(statuses).toEqual(['ready', 'playing', 'paused', 'playing']);
  });

  it('play depuis complete recommence au début ; resume est sans effet', () => {
    const { time, engine } = setup();
    engine.load(doc('a b'));
    engine.play();
    time.advance(1000);
    expect(engine.getSnapshot().status).toBe('complete');
    engine.resume();
    expect(engine.getSnapshot().status).toBe('complete');
    engine.play();
    expect(engine.getSnapshot()).toMatchObject({ status: 'playing', index: 0 });
  });

  it('affiche le dernier mot pendant sa durée avant de terminer', () => {
    const { time, engine } = setup();
    engine.load(doc('a b'));
    engine.play();
    time.advance(200);
    expect(engine.getSnapshot()).toMatchObject({ index: 1, status: 'playing' });
    time.advance(199);
    expect(engine.getSnapshot().status).toBe('playing');
    time.advance(1);
    expect(engine.getSnapshot().status).toBe('complete');
  });

  it('destroy est idempotent et libère la minuterie', () => {
    const { time, engine } = setup();
    engine.load(tenWords);
    engine.play();
    engine.destroy();
    engine.destroy();
    expect(time.pending).toBe(0);
    engine.load(tenWords);
    engine.play();
    expect(time.pending).toBe(0);
    expect(engine.isDestroyed).toBe(true);
  });

  it('un document vide reste idle', () => {
    const { engine } = setup();
    engine.load(buildDocument([]));
    engine.play();
    expect(engine.getSnapshot()).toMatchObject({ status: 'idle', index: -1, total: 0 });
  });
});

describe('RsvpEngine — navigation', () => {
  const text = doc('Une phrase ici. Deux mots. Et une troisième phrase.');

  it('seek borne l’index et conserve la lecture', () => {
    const { time, engine } = setup();
    engine.load(text);
    engine.seek(99);
    expect(engine.getSnapshot()).toMatchObject({ index: 8, status: 'paused' });
    engine.seek(-5);
    expect(engine.getSnapshot().index).toBe(0);
    engine.seek(Number.NaN);
    expect(engine.getSnapshot().index).toBe(0);
    engine.play();
    engine.seek(4);
    expect(engine.getSnapshot()).toMatchObject({ index: 4, status: 'playing' });
    time.advance(200);
    expect(engine.getSnapshot().index).toBe(5);
  });

  it('navigue par phrase', () => {
    const { engine } = setup();
    engine.load(text);
    engine.nextSentence();
    expect(engine.getSnapshot()).toMatchObject({ index: 3, sentenceIndex: 1 });
    engine.nextSentence();
    expect(engine.getSnapshot().index).toBe(5);
    engine.nextSentence();
    expect(engine.getSnapshot().index).toBe(8);
    engine.previousSentence(); // au milieu de la phrase → début de phrase
    expect(engine.getSnapshot().index).toBe(5);
    engine.previousSentence(); // au début → phrase précédente
    expect(engine.getSnapshot().index).toBe(3);
    engine.previousWord();
    expect(engine.getSnapshot().index).toBe(2);
    engine.nextWord();
    expect(engine.getSnapshot().index).toBe(3);
  });

  it('seek depuis complete passe en pause', () => {
    const { time, engine } = setup();
    engine.load(doc('a b'));
    engine.play();
    time.advance(1000);
    engine.seek(0);
    expect(engine.getSnapshot()).toMatchObject({ status: 'paused', index: 0 });
  });
});

describe('RsvpEngine — timing', () => {
  it('applique les pauses adaptatives', () => {
    const { time, engine } = setup({ speed: 300, timing: TIMING_PRESETS.normal });
    engine.load(doc('Un, deux. Trois'));
    engine.play();
    time.advance(200 * 1.5 - 1);
    expect(engine.getSnapshot().index).toBe(0);
    time.advance(1);
    expect(engine.getSnapshot().index).toBe(1);
    time.advance(200 * 2.25);
    expect(engine.getSnapshot().index).toBe(2);
  });

  it('changement de vitesse pendant la lecture : le mot courant est replanifié', () => {
    const { time, engine } = setup({ speed: 300 });
    engine.load(tenWords);
    engine.play();
    time.advance(100);
    expect(engine.setSpeed(600)).toBe(600); // 100 ms par mot, déjà écoulées
    time.advance(0);
    expect(engine.getSnapshot().index).toBe(1);
    time.advance(100);
    expect(engine.getSnapshot().index).toBe(2);
    expect(engine.setSpeed(1234)).toBe(900);
  });

  it('compense la dérive sans accumuler de retard', () => {
    const { time, engine } = setup({ speed: 300 });
    engine.load(tenWords);
    engine.play();
    for (let i = 0; i < 5; i++) time.advance(200);
    expect(engine.getSnapshot().index).toBe(5);
  });

  it('après une suspension d’horloge, reprend au mot suivant sans rafale', () => {
    const { time, engine, positions } = setup({ speed: 300 });
    engine.load(tenWords);
    engine.play();
    time.advance(200);
    expect(engine.getSnapshot().index).toBe(1);
    // L'onglet est gelé 30 s : aucune minuterie ne s'exécute.
    time.jump(30_000);
    time.advance(0);
    expect(engine.getSnapshot().index).toBe(2); // un seul mot, pas 150
    const before = positions.length;
    time.advance(199);
    expect(positions.length).toBe(before); // recalé sur l'instant présent
    time.advance(1);
    expect(engine.getSnapshot().index).toBe(3);
  });
});

describe('RsvpEngine — accélération progressive', () => {
  const acc = { enabled: true, startSpeed: 300, targetSpeed: 600, duration: 10, curve: 'linear' as const };

  it('fonction de vitesse linéaire et bornée', () => {
    expect(accelerationSpeed(acc, 0)).toBe(300);
    expect(accelerationSpeed(acc, 5000)).toBe(450);
    expect(accelerationSpeed(acc, 99_000)).toBe(600);
    expect(accelerationSpeed({ ...acc, targetSpeed: 5000 }, 99_000)).toBe(900);
    expect(accelerationSpeed({ ...acc, curve: 'ease-in-out' }, 5000)).toBe(450);
    expect(accelerationSpeed({ ...acc, curve: 'ease-in-out' }, 2500)).toBeLessThan(375);
  });

  it('monte en vitesse pendant la lecture uniquement', () => {
    const { time, engine } = setup({ acceleration: acc });
    engine.load(doc(Array.from({ length: 200 }, (_, i) => `m${i}`).join(' ')));
    expect(engine.getSnapshot()).toMatchObject({ speed: 300, accelerating: true });
    engine.play();
    time.advance(5000);
    const mid = engine.getSnapshot().speed;
    expect(mid).toBeGreaterThanOrEqual(445);
    expect(mid).toBeLessThanOrEqual(455);
    engine.pause();
    time.advance(60_000);
    expect(engine.getSnapshot().speed).toBe(mid); // suspendue avec la lecture
    engine.resume();
    time.advance(5100);
    expect(engine.getSnapshot()).toMatchObject({ speed: 600, accelerating: false });
  });

  it('un changement manuel de vitesse arrête la montée', () => {
    const { time, engine } = setup({ acceleration: acc });
    engine.load(tenWords);
    engine.play();
    time.advance(1000);
    engine.setSpeed(350);
    time.advance(1000);
    expect(engine.getSnapshot()).toMatchObject({ speed: 350, accelerating: false });
  });

  it('se réarme au rechargement et à la reprise depuis le début', () => {
    const { time, engine } = setup({ acceleration: acc });
    engine.load(doc('a b c'));
    engine.play();
    time.advance(10_000);
    expect(engine.getSnapshot().status).toBe('complete');
    engine.play();
    expect(engine.getSnapshot()).toMatchObject({ speed: 300, accelerating: true });
  });

  it('désactivée par configuration, revient à la vitesse fixe', () => {
    const { engine } = setup({ acceleration: acc, speed: 275 });
    engine.load(tenWords);
    engine.configure({ acceleration: { ...acc, enabled: false } });
    expect(engine.getSnapshot()).toMatchObject({ speed: 275, accelerating: false });
  });
});

describe('RsvpEngine — réentrance depuis les abonnés', () => {
  it('une pause demandée à la notification « playing » ne laisse aucune minuterie', () => {
    const { time, engine } = setup();
    engine.load(tenWords);
    engine.on('status', (e) => {
      if (e.status === 'playing') engine.pause('user');
    });
    engine.play();
    expect(engine.getSnapshot().status).toBe('paused');
    expect(time.pending).toBe(0);
    time.advance(5000);
    expect(engine.getSnapshot().index).toBe(0);
  });

  it('une pause demandée à un changement de mot ne relance pas la minuterie', () => {
    const { time, engine } = setup();
    engine.load(tenWords);
    engine.play();
    engine.on('position', (s) => {
      if (s.index === 3) engine.pause('user');
    });
    time.advance(200 * 10);
    expect(engine.getSnapshot()).toMatchObject({ status: 'paused', index: 3 });
    expect(time.pending).toBe(0);
  });

  it('une destruction depuis un abonné arrête tout', () => {
    const { time, engine } = setup();
    engine.load(tenWords);
    engine.on('position', (s) => {
      if (s.index === 2) engine.destroy();
    });
    engine.play();
    time.advance(200 * 10);
    expect(engine.isDestroyed).toBe(true);
    expect(time.pending).toBe(0);
  });

  it('relancer depuis « complete » dans l’abonné de statut n’émet pas de fin périmée', () => {
    const { time, engine } = setup();
    engine.load(doc('a b'));
    let completes = 0;
    engine.on('complete', () => completes++);
    let restarted = false;
    engine.on('status', (e) => {
      if (e.status === 'complete' && !restarted) {
        restarted = true;
        engine.play();
      }
    });
    engine.play();
    time.advance(400);
    expect(completes).toBe(0);
    expect(engine.getSnapshot()).toMatchObject({ status: 'playing', index: 0 });
    expect(time.pending).toBe(1);
  });

  it('seek en lecture puis pause dans l’abonné : aucune minuterie', () => {
    const { time, engine } = setup();
    engine.load(tenWords);
    engine.play();
    const off = engine.on('position', () => engine.pause('user'));
    engine.seek(5);
    off();
    expect(engine.getSnapshot()).toMatchObject({ status: 'paused', index: 5 });
    expect(time.pending).toBe(0);
  });
});

describe('RsvpEngine — index de départ', () => {
  it.each([
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [1.5, 1],
    [-3, 0],
    [99, 9],
  ])('startIndex %s → %s', (start, expected) => {
    const { engine } = setup();
    engine.load(tenWords, start);
    expect(engine.getSnapshot().index).toBe(expected);
    expect(engine.currentWord()?.text).toBe(tenWords.words[expected]!.text);
  });
});
