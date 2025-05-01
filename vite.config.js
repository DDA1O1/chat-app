import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { // Add server configuration
    proxy: {
      // Proxy API requests to the Vercel dev server (usually runs on 3000)
      '/api': {
        target: 'http://localhost:3000', // Target the server Vercel CLI runs
        changeOrigin: true, // Recommended for virtual hosted sites
        // No rewrite needed if Vercel handles the /api path directly
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    }
  }
})