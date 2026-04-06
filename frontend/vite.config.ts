import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Match Supabase docs that use NEXT_PUBLIC_*; Vite defaults to VITE_ only.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
