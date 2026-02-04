import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Optimize images for production
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Suppress hydration warnings caused by browser extensions (password managers, form fillers)
  // These extensions add attributes like fdprocessedid before React hydration
  reactStrictMode: true,
  // Note: Hydration mismatches from browser extensions are safe to ignore
};

export default nextConfig;
