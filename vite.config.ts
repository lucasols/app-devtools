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
  test: {
    include: ['test/*.test.{ts,tsx}'],
    testTimeout: 5_000,
    environment: 'happy-dom',
  },
}))
