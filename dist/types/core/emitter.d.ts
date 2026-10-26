/** Émetteur d'événements typé, minimal et sans dépendance. */
export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;
export declare class Emitter<Events extends object> {
    private readonly listeners;
    on<K extends keyof Events>(type: K, listener: Listener<Events[K]>): Unsubscribe;
    off<K extends keyof Events>(type: K, listener: Listener<Events[K]>): void;
    /**
     * Notifie les abonnés. Une exception levée par un abonné est isolée et
     * transmise à `onListenerError` pour ne pas interrompre la lecture.
     */
    emit<K extends keyof Events>(type: K, payload: Events[K], onListenerError?: (error: unknown) => void): void;
    listenerCount(type?: keyof Events): number;
    clear(): void;
}
