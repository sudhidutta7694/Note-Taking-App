import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Add Turbopack-specific configuration
  turbopack: {
    // Ensure proper root resolution
    resolveAlias: {
      '@': './src',
    },
  },
  typescript: {
    // ⚠️ WARNING: This allows production builds to complete even with type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  // Disable experimental features that might conflict
  experimental: {
    // Remove any conflicting experimental features
  },
};

export default nextConfig;
