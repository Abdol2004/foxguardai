/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@foxguard/shared"],
  experimental: { serverComponentsExternalPackages: ["mongoose"] },
};

export default config;
