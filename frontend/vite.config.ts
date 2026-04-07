import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devApiTarget = 'http://localhost:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Match Supabase docs that use NEXT_PUBLIC_*; Vite defaults to VITE_ only.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    // Prefer 5193 for this repo; if busy Vite picks the next free port (check terminal for the URL).
    port: 5193,
    strictPort: false,
    proxy: {
      // Same-origin in dev (no CORS). Target must match backend Properties/launchSettings.json (http://localhost:4000).
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (_error, req, res) => {
            const httpRes = res as {
              headersSent?: boolean
              writableEnded?: boolean
              writeHead: (statusCode: number, headers: Record<string, string>) => void
              end: (body: string) => void
            }

            if (httpRes.headersSent || httpRes.writableEnded) {
              return
            }

            httpRes.writeHead(503, { 'Content-Type': 'application/json' })
            httpRes.end(
              JSON.stringify({
                error: `Vite could not reach the development API at ${devApiTarget}. Start backend/intex/intex with dotnet run, or set VITE_API_BASE_URL in frontend/.env.development.local.`,
                path: req.url,
              }),
            )
          })
        },
      },
    },
  },
})
