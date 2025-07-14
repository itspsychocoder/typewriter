import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"



export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // This is crucial for Electron - use relative paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      // Ensure consistent file names for easier debugging
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})