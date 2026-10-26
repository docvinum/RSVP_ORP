import { Component, ElementRef, OnDestroy, inject, viewChild } from '@angular/core';
import { RsvpReaderService } from './rsvp-reader.service';

@Component({
  selector: 'app-articles-page',
  template: `
    <article id="section-dom" #domSection>
      <p class="format">Source : DOM (composant Angular)</p>
      <h2>Qu’est-ce que la lecture RSVP ?</h2>
      <p>
        La présentation visuelle sérielle rapide affiche un texte mot par mot, toujours au même endroit. Une lettre de
        chaque mot est mise en évidence et reste alignée sur un axe fixe.
      </p>
      <p>Les virgules, les fins de phrases et les fins de paragraphes allongent légèrement l’affichage.</p>
      <button type="button" class="read" data-section="dom" (click)="readDom()">Lecture rapide</button>
    </article>
    <article id="section-html">
      <p class="format">Source : HTML</p>
      <pre style="white-space: pre-wrap">{{ html }}</pre>
      <button type="button" class="read" data-section="html" (click)="reader.open({ type: 'html', html })">Lecture rapide</button>
    </article>
    <article id="section-markdown">
      <p class="format">Source : Markdown</p>
      <pre style="white-space: pre-wrap">{{ markdown }}</pre>
      <button type="button" class="read" data-section="markdown" (click)="reader.open({ type: 'markdown', markdown })">Lecture rapide</button>
    </article>
    <article id="section-text">
      <p class="format">Source : texte brut (anglais)</p>
      <pre style="white-space: pre-wrap">{{ text }}</pre>
      <button type="button" class="read" data-section="text" (click)="reader.open({ type: 'text', text }, { contentLocale: 'en' })">Lecture rapide</button>
    </article>
  `,
})
export class ArticlesPageComponent implements OnDestroy {
  protected readonly reader = inject(RsvpReaderService);
  private readonly domSection = viewChild.required<ElementRef<HTMLElement>>('domSection');

  protected readonly html =
    '<h2>La fixation du regard</h2><p>L’œil procède par <em>saccades</em> et par <strong>fixations</strong>.</p><p>Le point de reconnaissance optimal se situe légèrement à gauche du centre du mot.</p>';
  protected readonly markdown = `## Bonnes pratiques

Commencez **lentement**, puis augmentez la vitesse par paliers de 25 mots par minute.

- Faites des pauses régulières.
- Relisez le texte intégral en cas de doute.`;
  protected readonly text = `Speed reading in English.

Contractions such as don't and it's, abbreviations like Mr. Smith, and numbers like 3.14 are handled.`;

  protected readDom(): void {
    void this.reader.open({ type: 'dom', element: this.domSection().nativeElement });
  }

  ngOnDestroy(): void {
    // Changement de route : la section source disparaît, on ferme le lecteur.
    this.reader.close();
  }
}
