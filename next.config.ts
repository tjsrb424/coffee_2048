import type { NextConfig } from "next";

// GitHub Pages 프로젝트 사이트: 저장소 이름과 동일한 하위 경로
const githubPagesBasePath = "/coffe_2048";

const isProdBuild = process.env.NODE_ENV === "production";

// CI에서 명시하면 GITHUB_ACTIONS 여부와 무관하게 동일한 base로 빌드됨.
// 로컬 셸에 GITHUB_ACTIONS=true가 남아 있으면 `next dev`까지 basePath/export가 켜져
// `/lobby/`가 404가 되거나(배포 경로만 존재) dev가 불안정해질 수 있어,
// 실제 배포용 basePath는 `next build`(production)에서만 자동 적용한다.
const deployedBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() ||
  (process.env.GITHUB_ACTIONS === "true" && isProdBuild
    ? githubPagesBasePath
    : "");

/** `output: "export"`는 production 빌드에서만 CI 플래그로 켠다. dev에서 켜면 오류 컴포넌트 누락 등이 날 수 있음 */
const enableStaticExport =
  process.env.NEXT_STATIC_EXPORT === "true" ||
  (process.env.GITHUB_ACTIONS === "true" && isProdBuild);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.50.8"],
  ...(enableStaticExport ? { output: "export" as const } : {}),
  basePath: deployedBasePath,
  assetPrefix: deployedBasePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: deployedBasePath,
  },
  images: { unoptimized: true },
  trailingSlash: true,
  // Windows에서 `.next` 디스크 캐시 매니페스트 경합(ENOENT/MODULE_NOT_FOUND) 완화 목적이었으나,
  // `cache: false`는 증분 빌드마다 청크/모듈 테이블이 흔들려 HMR 직후 브라우저에
  // `__webpack_modules__[moduleId] is not a function`이 잘 난다.
  // 메모리 캐시는 디스크 경합을 피하면서도 모듈 그래프 안정성이 더 낫다. 재발 시 `npm run clean`·강력 새로고침·`npm run dev:turbo`.
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" as const };
    }
    return config;
  },
};

export default nextConfig;
