import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DatumX/', // GitHub Pages base path
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
