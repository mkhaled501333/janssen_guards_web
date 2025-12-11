/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        // Allow any IP address for local network access
        hostname: '**',
      },
      {
        protocol: 'https',
        // Allow any IP address for local network access
        hostname: '**',
      },
    ],
  },
  // Webpack config for @react-pdf/renderer (used when --webpack flag is set)
  webpack: (config, { isServer }) => {
    // Fix for @react-pdf/renderer in Next.js
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'canvas-prebuilt'];
    }
    
    // Handle canvas and other node modules for @react-pdf/renderer
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },
  // Turbopack config (used by default in Next.js 16)
  turbopack: {
    // @react-pdf/renderer should work with Turbopack without special config
    // If issues occur, we can add resolveAlias here
  },
};

export default nextConfig;

