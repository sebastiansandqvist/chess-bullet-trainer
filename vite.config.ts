import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Chess Bullet Trainer',
        short_name: 'Bullet Trainer',
        description: 'Practice chess time scrambles against Stockfish.',
        theme_color: '#171717',
        background_color: '#171717',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        mode: 'development',
        disableDevLogs: true,
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
        globIgnores: ['stockfish/**'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/stockfish/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'stockfish-17.1-8e4d048',
              matchOptions: { ignoreVary: true },
            },
          },
        ],
      },
      minify: false,
    }),
  ],
  server: {
    cors: true,
    port: 3003,
    // hmr: false,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
