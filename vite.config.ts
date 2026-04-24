import { defineConfig } from 'vitest/config'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // ─── Build config for S3 static hosting ──────────────────────────
  // After `npm run build`, upload the entire `dist/` folder to your S3 bucket.
  //
  // Required S3 / CloudFront setup for SPA (react-router):
  //   Option A — S3 static website hosting:
  //     Set "Error document" to "index.html" in the bucket's static website settings.
  //   Option B — CloudFront (recommended):
  //     Add a Custom Error Response: 403 → /index.html (200), 404 → /index.html (200).
  build: {
    outDir: 'dist',           // Upload this folder to S3
    sourcemap: false,          // Set to true only in staging; never in prod (leaks source)
    rollupOptions: {
      output: {
        // Split vendor libraries into a separate chunk (better long-term caching on CDN)
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router'],
          'vendor-ui':     ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
                            '@radix-ui/react-tabs', '@radix-ui/react-select'],
          'vendor-charts': ['recharts'],
        },
        // Fingerprinted asset filenames for CloudFront long-term caching
        assetFileNames:  'assets/[name]-[hash][extname]',
        chunkFileNames:  'assets/[name]-[hash].js',
        entryFileNames:  'assets/[name]-[hash].js',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
