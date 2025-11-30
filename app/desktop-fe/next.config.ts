import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack is enabled by default in Next.js 16; avoid custom webpack config.
};

export default nextConfig;
