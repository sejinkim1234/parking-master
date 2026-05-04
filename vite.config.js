import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages or Cloudflare Pages might need base config if deployed to subpath. 
  // Cloudflare pages usually uses root `/`. GitHub pages uses `/repo-name/` if not custom domain.
  // We'll leave it default for now, which is '/'
})
