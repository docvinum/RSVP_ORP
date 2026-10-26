import { Injectable, OnDestroy, signal } from '@angular/core';
// Le démonstrateur consomme exclusivement l'artefact copié (npm run sync:examples).
import {
  createReader,
  type OpenOptions,
  type Reader,
  type ReaderOptions,
  type ReaderSource,
} from '../../vendor/universal-rsvp-reader/universal-rsvp-reader.js';

/**
 * Service Angular encapsulant un lecteur. Fourni au niveau de l'application :
 * il survit aux changements de route, mais ferme le lecteur quand la page
 * source est détruite (voir ArticlesPageComponent.ngOnDestroy).
 */
@Injectable({ providedIn: 'root' })
export class RsvpReaderService implements OnDestroy {
  readonly status = signal('—');
  readonly log = signal<string[]>([]);
  private reader: Reader | null = null;
  private offs: (() => void)[] = [];
  private options: ReaderOptions = {};

  constructor() {
    this.create();
  }

  get instance(): Reader | null {
    return this.reader;
  }

  create(options: ReaderOptions = this.options): void {
    this.destroy();
    this.options = options;
    const r = createReader(options);
    this.offs = (['open', 'play', 'pause', 'complete', 'close', 'error', 'settings-change'] as const).map((type) =>
      r.on(type, (e: unknown) => {
        const ev = e as { reason?: string; changed?: string[]; error?: { code: string } };
        const detail = ev.error?.code ?? ev.changed?.join(',') ?? ev.reason ?? '';
        this.log.update((l) => [`${type}${detail ? ` (${detail})` : ''}`, ...l].slice(0, 40));
        this.status.set(r.getState().status);
      }),
    );
    this.reader = r;
    this.status.set('créé');
  }

  async open(source: ReaderSource, options?: OpenOptions): Promise<void> {
    if (!this.reader) this.create();
    try {
      await this.reader!.open(source, options);
    } catch (e) {
      this.log.update((l) => [`échec : ${(e as { code?: string }).code ?? String(e)}`, ...l]);
    }
  }

  close(): void {
    this.reader?.close();
  }

  destroy(): void {
    this.offs.forEach((off) => off());
    this.offs = [];
    this.reader?.destroy();
    this.reader = null;
    this.status.set('détruit');
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
