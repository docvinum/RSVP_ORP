import type { Clock, Timer } from '../../src/core/engine';

/** Horloge et minuterie virtuelles, déterministes. */
export class FakeTime implements Clock, Timer {
  private t = 0;
  private seq = 0;
  private tasks = new Map<number, { at: number; cb: () => void }>();

  now(): number {
    return this.t;
  }

  set(cb: () => void, delay: number): unknown {
    const id = ++this.seq;
    this.tasks.set(id, { at: this.t + Math.max(0, delay), cb });
    return id;
  }

  clear(handle: unknown): void {
    this.tasks.delete(handle as number);
  }

  get pending(): number {
    return this.tasks.size;
  }

  /** Avance le temps en exécutant les tâches échues dans l'ordre. */
  advance(ms: number): void {
    const end = this.t + ms;
    for (;;) {
      let next: [number, { at: number; cb: () => void }] | undefined;
      for (const entry of this.tasks) if (entry[1].at <= end && (!next || entry[1].at < next[1].at)) next = entry;
      if (!next) break;
      this.tasks.delete(next[0]);
      this.t = Math.max(this.t, next[1].at);
      next[1].cb();
    }
    this.t = end;
  }

  /** Saute dans le temps sans exécuter les tâches (simulation d'onglet gelé). */
  jump(ms: number): void {
    this.t += ms;
  }
}
