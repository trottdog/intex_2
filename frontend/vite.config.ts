import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Match Supabase docs that use NEXT_PUBLIC_*; Vite defaults to VITE_ only.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    proxy: {
      // Same-origin in dev (no CORS). Target must match backend Properties/launchSettings.json (http://localhost:4000).
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
