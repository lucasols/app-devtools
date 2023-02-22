import { defineConfig } from 'tsup'
import glob from 'tiny-glob'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
})
