import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      // other turbopack rules
    },
  },
  allowedDevOrigins: ["192.168.0.0/16"],
  async rewrites() {
    return [];
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [];
  },
};

export default nextConfig;
