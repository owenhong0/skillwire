import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pure static frontend — no backend. The browser calls GitHub Search and
// Hacker News directly (both keyless, both CORS-enabled), so there's no dev
// proxy to configure.
export default defineConfig({
  // GitHub Pages serves a project site at https://<user>.github.io/<repo>/, so
  // asset paths must be prefixed with the repo name. This matches the homepage
  // URL (owenhong0.github.io/skillwire). The path is case-sensitive and must
  // match the repo name exactly.
  base: '/skillwire/',
  plugins: [react()],
  server: { port: 5173 },
})
