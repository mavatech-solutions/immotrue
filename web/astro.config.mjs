// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // shared/ lives one level up from web/ in the monorepo — Vite's dev
    // server otherwise refuses to serve files outside its project root.
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});