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
  async headers() {
    return [
      {
        // Match all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Allow all origins including https://localhost
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

export default nextConfig;
