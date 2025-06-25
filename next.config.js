/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: false, // Keep using pages directory for now
  },
  env: {
    // Make AI agent configuration available to client-side
    CUSTOMER_SUPPORT_AGENT_ID: process.env.CUSTOMER_SUPPORT_AGENT_ID,
    MECHANIC_ASSISTANT_AGENT_ID: process.env.MECHANIC_ASSISTANT_AGENT_ID,
  },
  // Webpack configuration for AI integration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle for AI libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Headers for AI API routes
  async headers() {
    return [
      {
        source: '/api/trpc/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  // Redirects for AI agent URLs
  async redirects() {
    return [
      {
        source: '/chat/customer-support',
        destination: '/?chat=customer-support',
        permanent: false,
      },
      {
        source: '/chat/mechanic-assistant',
        destination: '/mechanic/dashboard?chat=mechanic-assistant',
        permanent: false,
      },
    ];
  },
  // Image optimization for AI-generated content
  images: {
    domains: [
      'api.abacus.ai',
      'apps.abacus.ai',
      // Add other domains as needed
    ],
  },
};

module.exports = nextConfig;