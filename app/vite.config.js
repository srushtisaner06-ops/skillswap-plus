import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true,
    // Proxy API requests to the backend server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist'
  },
  define: {
    'window.__GOOGLE_CLIENT_ID__': JSON.stringify(process.env.VITE_GOOGLE_CLIENT_ID),
    'window.__API_URL__': JSON.stringify(process.env.VITE_API_URL)
  }
});

