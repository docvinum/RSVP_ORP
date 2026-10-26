/** Émetteur d'événements typé, minimal et sans dépendance. */
export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(type, listener);
  }

  off<K extends keyof Events>(type: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(type);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(type);
  }

  /**
   * Notifie les abonnés. Une exception levée par un abonné est isolée et
   * transmise à `onListenerError` pour ne pas interrompre la lecture.
   */
  emit<K extends keyof Events>(type: K, payload: Events[K], onListenerError?: (error: unknown) => void): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        (listener as Listener<Events[K]>)(payload);
      } catch (error) {
        if (onListenerError) onListenerError(error);
        else queueMicrotask(() => {
          throw error;
        });
      }
    }
  }

  listenerCount(type?: keyof Events): number {
    if (type !== undefined) return this.listeners.get(type)?.size ?? 0;
    let n = 0;
    for (const set of this.listeners.values()) n += set.size;
    return n;
  }

  clear(): void {
    this.listeners.clear();
  }
}
