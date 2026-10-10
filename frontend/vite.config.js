import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run build` writes straight into the Laravel public folder (backend/public/spa)
// so the whole product deploys as one Laravel app (ideal for Hostinger shared hosting).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/spa/' : '/',
  build: {
    outDir: '../backend/public/spa',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
      '/brand': 'http://127.0.0.1:8000',
      '/sitemap.xml': 'http://127.0.0.1:8000',
    },
  },
}))
