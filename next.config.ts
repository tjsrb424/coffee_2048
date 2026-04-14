import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";
// GitHub Pages는 리포지토리명 하위 경로로 서비스됨
const githubPagesBasePath = "/coffe_2048";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.50.8"],
  // GitHub Pages 배포를 위한 정적 export
  output: "export",
  basePath: isGithubPages ? githubPagesBasePath : "",
  assetPrefix: isGithubPages ? githubPagesBasePath : "",
  images: { unoptimized: true },
  trailingSlash: true,
  // Windows에서 dev 중 `.next` 매니페스트 경합(ENOENT/MODULE_NOT_FOUND) 완화
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
