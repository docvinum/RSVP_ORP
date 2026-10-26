import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { RsvpReaderService } from './rsvp-reader.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="site">
      <strong>Démo Angular</strong>
      <nav aria-label="Navigation de la démo">
        <a routerLink="/articles">Articles</a>
        <a routerLink="/a-propos">À propos</a>
      </nav>
    </header>
    <main><router-outlet /></main>
    <aside class="lifecycle" aria-label="Cycle de vie du lecteur">
      <h2>Cycle de vie</h2>
      <p>Lecteur : <output id="reader-status">{{ reader.status() }}</output></p>
      <label><input type="checkbox" id="persist" [checked]="persist()" (change)="togglePersist($event)" /> Persistance locale des préférences</label>
      <div class="row">
        <button id="destroy" type="button" (click)="reader.destroy()">Détruire le lecteur</button>
        <button id="recreate" type="button" (click)="reader.create()">Recréer le lecteur</button>
      </div>
      <h3>Événements</h3>
      <ol id="log" class="log">
        @for (entry of reader.log(); track $index) {
          <li>{{ entry }}</li>
        }
      </ol>
    </aside>
  `,
})
export class AppComponent {
  protected readonly reader = inject(RsvpReaderService);
  protected readonly persist = signal(false);

  constructor() {
    // Accès de test et de débogage.
    const service = this.reader;
    (window as unknown as { demo: unknown }).demo = { get reader() { return service.instance; } };
  }

  protected togglePersist(event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.persist.set(enabled);
    this.reader.create({ persistence: { enabled, storageKey: 'demo-angular:rsvp' } });
  }
}
