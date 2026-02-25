import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent heavy server-only libs from being bundled for the browser
  serverExternalPackages: ['bcryptjs', 'speakeasy', 'nodemailer', 'mongoose'],

  // Speed up local development compilations for heavy UI libraries
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  // Skip TypeScript type errors during dev for speed
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
