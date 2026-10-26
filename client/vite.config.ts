import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The API server runs on port 5002 by default (see server/.env PORT setting)
const API_TARGET = process.env.API_TARGET || 'http://localhost:5002'
const CLIENT_PORT = Number(process.env.CLIENT_PORT || 5173)

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: CLIENT_PORT,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
