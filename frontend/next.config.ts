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
  // Disable experimental features that might conflict
  experimental: {
    // Remove any conflicting experimental features
  },
};

export default nextConfig;
