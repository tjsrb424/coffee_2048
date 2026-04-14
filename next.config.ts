import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.50.8"],
  // Windows에서 dev 중 `.next` 매니페스트 경합(ENOENT/MODULE_NOT_FOUND) 완화
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
