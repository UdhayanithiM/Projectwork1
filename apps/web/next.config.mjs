import "dotenv/config";

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
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  experimental: {
    optimizeCss: true,
    esmExternals: "loose", // Required for some ESM modules (Spline, Three)
  },

  // ⭐ REQUIRED FOR SPLINE + THREE + FRAMER MOTION
  transpilePackages: [
    "@splinetool/react-spline",
    "@splinetool/runtime",
    "three",
    "framer-motion"
  ],

  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, // prevent server-side fs errors
    };
    return config;
  },

  // ⭐ Backend rewrite (Connects Next.js to Python)
  async rewrites() {
    return [
      // 1. WebSocket Proxy for Hume AI (Voice Mode)
      // This allows ws://localhost:3000/ws/hume/... to connect to Port 8000
      {
        source: "/ws/hume/:path*",
        destination: "http://127.0.0.1:8000/ws/hume/:path*",
      },
      // 2. REST API Proxy (Resume Parsing, Assessment Generation)
      // This allows /api/ai/... calls to hit the Python backend
      {
        source: "/api/ai/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;