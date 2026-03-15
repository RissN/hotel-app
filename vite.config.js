import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  esbuild: {
    // Hapus console.log saat production build, tapi pertahankan console.error & console.warn
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
  },
})
