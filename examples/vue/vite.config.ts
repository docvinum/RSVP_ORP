import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// base relative : le build peut être servi depuis n'importe quel chemin.
export default defineConfig({ base: './', plugins: [vue()] });
