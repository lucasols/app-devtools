import solidLabels from 'babel-plugin-solid-labels'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import packageJson from './package.json'

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
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'App Devtools',
      // the proper extensions will be added
      fileName: 'main',
      formats: ['es'],
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [...Object.keys(packageJson.dependencies)],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
    minify: false,
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
