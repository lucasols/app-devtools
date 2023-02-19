import solidLabels from 'babel-plugin-solid-labels'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig((config) => ({
  plugins: [
    solidPlugin({
      babel: {
        plugins: [[solidLabels, { dev: config.command === 'serve' }]],
      },
    }),
    VitePWA({
      manifest: {
        background_color: '#ffffff',
        theme_color: '#ffffff',
        short_name: 'Solver',
        name: 'Solver',
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: [
      { find: '@src', replacement: '/src' },
      { find: '@utils', replacement: '/utils' },
    ],
  },
}))
