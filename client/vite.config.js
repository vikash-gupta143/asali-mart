import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'robots.txt', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'AsaliMart - Local Marketplace',
        short_name: 'AsaliMart',
        description: 'Shop from nearby shops, get fast delivery, and bargain directly with sellers.',
        theme_color: '#FF6B00',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
  {
    src: '/pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'any',
  },
  {
    src: '/pwa-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable',
  },
  {
    src: '/pwa-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.asalideal\.in\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})