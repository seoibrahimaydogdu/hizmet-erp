import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    port: 3000, // Farklı port kullanın
    host: true,
    strictPort: false, // Port meşgulse otomatik olarak başka port seçsin
    hmr: {
      overlay: false, // HMR overlay'i kapatın
    },
  },
});
