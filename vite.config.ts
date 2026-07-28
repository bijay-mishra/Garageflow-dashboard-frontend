import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Same port as the ERP client so bookmarks and CORS rules line up.
    port: 5000,
    open: true,
    // When you wire the real .NET API, uncomment to proxy /api during dev so
    // there are no CORS headaches:
    // proxy: {
    //   '/api': { target: 'https://localhost:7001', changeOrigin: true, secure: false },
    // },
  },
})
