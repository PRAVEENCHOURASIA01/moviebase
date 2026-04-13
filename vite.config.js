import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // ─────────────────────────────────────────
  // Path alias — import from '@/components/...'
  // instead of '../../../components/...'
  // ─────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ─────────────────────────────────────────
  // Build optimizations for Vercel deployment
  // ─────────────────────────────────────────
  build: {
    outDir: 'dist',
    sourcemap: false,       // Disable in prod — no source leaks
    minify: 'esbuild',      // Fast, reliable minification
    target: 'es2020',
    rollupOptions: {
      output: {
        // Split vendor chunks — better caching on CDN
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Warn if any chunk exceeds 500kb
    chunkSizeWarningLimit: 500,
  },

  // ─────────────────────────────────────────
  // Dev server settings
  // ─────────────────────────────────────────
  server: {
    port: 5173,
    strictPort: true,   // Fail fast if port is taken
    open: true,
  },

  // ─────────────────────────────────────────
  // Preview (after build)
  // ─────────────────────────────────────────
  preview: {
    port: 4173,
  },
})