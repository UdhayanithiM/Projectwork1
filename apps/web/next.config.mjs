
// apps/web/next.config.mjs
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

  // ⭐ Backend rewrite (your Python service)
  async rewrites() {
    return [
      {
        source: "/api/ai/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
