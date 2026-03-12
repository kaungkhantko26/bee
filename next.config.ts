import type { NextConfig } from "next";

const basePath = process.env.BASE_PATH?.trim() || undefined;

const nextConfig: NextConfig = {
  basePath,
  output: "export",
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
