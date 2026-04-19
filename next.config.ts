import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' ONLY if building for Android/Capacitor locally
  output: process.env.MOBILE_BUILD === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Disable React Compiler for this project
  reactCompiler: false,
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
