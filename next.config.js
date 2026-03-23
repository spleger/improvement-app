const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    customWorkerDir: 'worker',
    runtimeCaching: [
        // API routes: network-first, short cache (5 min) for offline fallback
        {
            urlPattern: /^https?:\/\/.*\/api\/(?!auth).*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 64, maxAgeSeconds: 300 },
                networkTimeoutSeconds: 10,
            },
        },
        // Static assets: cache-first, long-lived
        {
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
                cacheName: 'static-resources',
                expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
            },
        },
        // Images: cache-first
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'images',
                expiration: { maxEntries: 64, maxAgeSeconds: 86400 },
            },
        },
        // Navigation: network-first
        {
            urlPattern: /^https?:\/\/.*\/(?!api\/).*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'pages',
                expiration: { maxEntries: 32, maxAgeSeconds: 86400 },
            },
        },
    ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken']
    }
}

module.exports = withPWA(nextConfig)
