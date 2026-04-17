import Image from "next/image";
import { LobbyScreen } from "@/features/lobby/components/LobbyScreen";
import { publicAssetPath } from "@/lib/publicAssetPath";

export default function LobbyPage() {
  /** GitHub Pages(`basePath`) 정적 배포에서 `/images`가 루트로 나가 404 나는 문제 방지 */
  const bgSrc = publicAssetPath("/images/lobby/coffee-shop-bg.png");

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src={bgSrc}
          alt="로비 배경"
          fill
          priority
          sizes="100vw"
          className="object-cover blur-sm"
          style={{ transform: "scale(1.03)" }}
        />
        <div className="absolute inset-0 bg-cream-100/40" aria-hidden />
        <div
          className="absolute inset-0 bg-gradient-to-b from-coffee-900/12 via-cream-100/10 to-coffee-900/12"
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <LobbyScreen />
      </div>
    </div>
  );
}
