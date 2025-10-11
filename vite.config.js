import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Allow JSX in .js files
      include: /\.(jsx|js|tsx|ts)$/,
    }),
  ],
})
