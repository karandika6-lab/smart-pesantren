import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' locally for Android/Capacitor, but run gracefully as a Serverless app on Vercel
  output: process.env.VERCEL !== '1' ? 'export' : undefined,
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
