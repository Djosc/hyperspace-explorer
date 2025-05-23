import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: [
      {
        find: '$lib',
        replacement: path.resolve(__dirname, './src/lib')
      }
    ]
  }
})
