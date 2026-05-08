import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@foxguard/shared"],
  experimental: { serverComponentsExternalPackages: ["mongoose"] },
};

export default config;
