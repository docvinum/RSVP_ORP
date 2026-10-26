<script setup lang="ts">
import { ref } from 'vue';
import type { ReaderSource } from '../../vendor/universal-rsvp-reader/universal-rsvp-reader.js';

const emit = defineEmits<{ read: [source: ReaderSource, options?: { contentLocale?: string }] }>();

const domSection = ref<HTMLElement | null>(null);

const markdown = `## Bonnes pratiques

Commencez **lentement**, puis augmentez la vitesse par paliers de 25 mots par minute.

- Faites des pauses régulières.
- Relisez le texte intégral en cas de doute.`;

const html = `<h2>La fixation du regard</h2><p>L’œil procède par <em>saccades</em> et par <strong>fixations</strong>.</p><p>Le point de reconnaissance optimal se situe légèrement à gauche du centre du mot.</p>`;

const text = `Speed reading in English.

Contractions such as don't and it's, abbreviations like Mr. Smith, and numbers like 3.14 are handled.`;
</script>

<template>
  <article id="section-dom" ref="domSection">
    <p class="format">Source : DOM (composant Vue)</p>
    <h2>Qu’est-ce que la lecture RSVP ?</h2>
    <p>
      La présentation visuelle sérielle rapide affiche un texte mot par mot, toujours au même endroit. Une lettre de
      chaque mot est mise en évidence et reste alignée sur un axe fixe.
    </p>
    <p>Les virgules, les fins de phrases et les fins de paragraphes allongent légèrement l’affichage.</p>
    <button type="button" class="read" data-section="dom" @click="emit('read', { type: 'dom', element: domSection! })">Lecture rapide</button>
  </article>
  <article id="section-html">
    <p class="format">Source : HTML</p>
    <pre style="white-space: pre-wrap">{{ html }}</pre>
    <button type="button" class="read" data-section="html" @click="emit('read', { type: 'html', html })">Lecture rapide</button>
  </article>
  <article id="section-markdown">
    <p class="format">Source : Markdown</p>
    <pre style="white-space: pre-wrap">{{ markdown }}</pre>
    <button type="button" class="read" data-section="markdown" @click="emit('read', { type: 'markdown', markdown })">Lecture rapide</button>
  </article>
  <article id="section-text">
    <p class="format">Source : texte brut (anglais)</p>
    <pre style="white-space: pre-wrap">{{ text }}</pre>
    <button type="button" class="read" data-section="text" @click="emit('read', { type: 'text', text }, { contentLocale: 'en' })">Lecture rapide</button>
  </article>
</template>
