import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

module.exports = {
  // other Next.js configuration options
  async rewrites() {
    return [
      // other rewrites
    ];
  },
  async redirects() {
    return [
      // other redirects
    ];
  },
  async onDemandEntries() {
    return [
      // other on-demand entries
    ];
  },
  async headers() {
    return [
      // other headers
    ];
  },
  async webpack(config: any, options: any) {
    // other webpack configuration
    return config;
  },
  // Enable error logging
  errorLog: "./logs/error.log",
};
