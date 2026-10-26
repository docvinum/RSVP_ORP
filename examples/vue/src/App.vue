<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import ArticlesPage from './components/ArticlesPage.vue';
import { useRsvpReader } from './composables/useRsvpReader';

// Routeur minimal par hash : changer de page démonte ArticlesPage.
const route = ref(location.hash || '#/articles');
const onHash = () => (route.value = location.hash || '#/articles');
onMounted(() => window.addEventListener('hashchange', onHash));
onBeforeUnmount(() => window.removeEventListener('hashchange', onHash));

const persist = ref(false);
const { reader, status, log, open, create, destroy } = useRsvpReader();
create();

watch(persist, (enabled) => create({ persistence: { enabled, storageKey: 'demo-vue:rsvp' } }));
// Changement de route : le contenu source disparaît, on ferme le lecteur.
watch(route, () => reader.value?.close());

(window as unknown as { demo: unknown }).demo = { get reader() { return reader.value; } };
</script>

<template>
  <header class="site">
    <strong>Démo Vue 3</strong>
    <nav aria-label="Navigation de la démo">
      <a href="#/articles">Articles</a>
      <a href="#/a-propos">À propos</a>
    </nav>
  </header>
  <main>
    <ArticlesPage v-if="route !== '#/a-propos'" @read="open" />
    <article v-else>
      <h2>À propos</h2>
      <p>Changer de page démonte les articles et ferme le lecteur ouvert.</p>
    </article>
  </main>
  <aside class="lifecycle" aria-label="Cycle de vie du lecteur">
    <h2>Cycle de vie</h2>
    <p>Lecteur : <output id="reader-status">{{ status }}</output></p>
    <label><input v-model="persist" type="checkbox" id="persist" /> Persistance locale des préférences</label>
    <div class="row">
      <button id="destroy" type="button" @click="destroy">Détruire le lecteur</button>
      <button id="recreate" type="button" @click="create()">Recréer le lecteur</button>
    </div>
    <h3>Événements</h3>
    <ol id="log" class="log">
      <li v-for="(entry, i) in log" :key="i">{{ entry }}</li>
    </ol>
  </aside>
</template>
