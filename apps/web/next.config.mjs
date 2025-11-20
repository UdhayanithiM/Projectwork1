import 'dotenv/config'; 

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
    esmExternals: 'loose',
  },
  transpilePackages: ['framer-motion', 'chart.js', 'three'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // --- PHASE 1 INTEGRATION: REWRITE RULES ---
  async rewrites() {
    return [
      {
        // Map internal API calls to the Python Service
        source: '/api/ai/:path*',
        destination: 'http://127.0.0.1:8000/:path*', 
      },
    ];
  },
};

export default nextConfig;