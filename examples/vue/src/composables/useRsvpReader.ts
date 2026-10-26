import { onBeforeUnmount, ref, shallowRef } from 'vue';
// Le démonstrateur consomme exclusivement l'artefact copié (npm run sync:examples).
import { createReader, type Reader, type ReaderOptions, type ReaderSource } from '../../vendor/universal-rsvp-reader/universal-rsvp-reader.js';

/**
 * Composable Vue : un lecteur par composant, détruit au démontage
 * (changement de route, v-if…). Aucun listener ni minuterie ne survit.
 */
export function useRsvpReader(options: ReaderOptions = {}) {
  const reader = shallowRef<Reader | null>(null);
  const status = ref('—');
  const log = ref<string[]>([]);
  let offs: (() => void)[] = [];

  function push(entry: string) {
    log.value = [entry, ...log.value].slice(0, 40);
  }

  function create(extra: ReaderOptions = {}) {
    destroy();
    const r = createReader({ ...options, ...extra });
    offs = (['open', 'play', 'pause', 'complete', 'close', 'error', 'settings-change'] as const).map((type) =>
      r.on(type, (e: unknown) => {
        const ev = e as { reason?: string; changed?: string[]; error?: { code: string } };
        const detail = ev.error?.code ?? ev.changed?.join(',') ?? ev.reason ?? '';
        push(`${type}${detail ? ` (${detail})` : ''}`);
        status.value = r.getState().status;
      }),
    );
    reader.value = r;
    status.value = 'créé';
  }

  function destroy() {
    offs.forEach((off) => off());
    offs = [];
    reader.value?.destroy();
    reader.value = null;
    status.value = 'détruit';
  }

  async function open(source: ReaderSource, openOptions?: Parameters<Reader['open']>[1]) {
    if (!reader.value) create();
    try {
      await reader.value!.open(source, openOptions);
    } catch (e) {
      push(`échec : ${(e as { code?: string }).code ?? e}`);
    }
  }

  onBeforeUnmount(destroy);
  return { reader, status, log, open, create, destroy };
}
