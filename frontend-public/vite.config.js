import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // Specify preferred port for frontend-public
    strictPort: true, // Ensures frontend-public always locks to preferred port, preventing auto-increment if busy
    host: true        // Listens on all addresses (0.0.0.0) inside Docker
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared') // Alias for shared components and utilities
    }
  }
})
