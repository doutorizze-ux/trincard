import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { traeBadgePlugin } from 'vite-plugin-trae-solo-badge';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),
    traeBadgePlugin({
      variant: 'dark',
      position: 'bottom-right',
      prodOnly: true,
      clickable: true,
      clickUrl: 'https://www.trae.ai/solo?showJoin=1',
      autoTheme: true,
      autoThemeTarget: '#root'
    }), 
    tsconfigPaths(),
  ],
  server: {
    hmr: {
      overlay: false
    },
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err.message);
          });
        },
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@supabase/supabase-js',
      'react-router-dom',
      'zustand',
      'lucide-react',
      'sonner',
      'react-hook-form'
    ],
    force: false
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('react-router')) {
                return 'router';
              }
              if (id.includes('@supabase')) {
                return 'supabase';
              }
              if (id.includes('@radix-ui') || id.includes('lucide-react')) {
                return 'ui-components';
              }
              if (id.includes('react-hook-form') || id.includes('@hookform')) {
                return 'forms';
              }
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              if (id.includes('sonner') || id.includes('react-hot-toast')) {
                return 'notifications';
              }
              if (id.includes('jsbarcode') || id.includes('qrcode')) {
                return 'barcode';
              }
              // Other vendor libraries
              return 'vendor';
            }
            
            // App chunks
            if (id.includes('/pages/')) {
              if (id.includes('AdminPage')) {
                return 'admin';
              }
              if (id.includes('DashboardPage')) {
                return 'dashboard';
              }
              return 'pages';
            }
            
            if (id.includes('/components/')) {
              return 'components';
            }
            
            if (id.includes('/hooks/') || id.includes('/utils/')) {
              return 'utils';
            }
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js'
        },
        onwarn(warning, warn) {
          if (warning.code === 'CHUNK_SIZE_EXCEEDED') {
            return;
          }
          warn(warning);
        }
      },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    target: 'esnext',
    platform: 'browser'
  }
})
