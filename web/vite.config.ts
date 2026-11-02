import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // React + wagmi + viem come to ~600 kB minified (~180 kB gzipped); that is expected here.
  build: { chunkSizeWarningLimit: 700 },
})
