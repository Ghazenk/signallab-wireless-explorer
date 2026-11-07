import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    host: '0.0.0.0',
    allowedHosts: 'all'
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/d3')) {
            return 'vendor-d3';
          }
        }
      }
    }
  }
});
