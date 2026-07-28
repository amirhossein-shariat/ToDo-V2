import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'logo-icon.png'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Spark',
        short_name: 'Spark',
        description: 'Manage Tasks & Goals',
        start_url: '/',
        display: 'standalone',
        background_color: '#132a4a',
        theme_color: '#132a4a',
        icons: [
          { src: '/logo-icon.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo-icon.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // درخواست‌های API هرگز کش نمی‌شوند — منطق آفلاین توسط لایه
            // IndexedDB خودمان (src/offline) مدیریت می‌شود، نه service worker
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
