import { copyFileSync } from 'fs'
import { join } from 'path'
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/vibeverse.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
    treeshake: true,
    external: ['three'],
    outDir: 'dist',
    target: 'es2020',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      }
      return options
    },
    onSuccess: async () => {
      copyFileSync('llm.md', join('dist', 'llm.md'))
      return Promise.resolve()
    },
  },
  {
    entry: ['src/vibeverse.ts'],
    format: ['esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: false,
    minify: false,
    treeshake: true,
    external: ['three'],
    outDir: 'dist',
    target: 'es2020',
    outExtension({ format }) {
      return {
        js: '.debug.js',
      }
    },
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      }
      return options
    },
    onSuccess: async () => {
      copyFileSync('llm.md', join('dist', 'llm.md'))
      return Promise.resolve()
    },
  },
])
