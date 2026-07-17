// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://immotrue.de',
  prefetch: true,
  integrations: [
    react(),
    sitemap({
      // Authenticated app screens (redirect to /login for crawlers anyway)
      // add nothing to search results — only the public marketing/content
      // pages belong in the sitemap.
      filter: (page) =>
        !/\/(alerts|analyse|ergebnis|portfolio|login|dashboard|upgrade|forgot-password|reset-password)(\/.*)?\/?$/.test(page),
    }),
  ],
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