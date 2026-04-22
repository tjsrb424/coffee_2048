"use client";

import { Card } from "@/components/ui/Card";
import { LiveOpsDevTools } from "./LiveOpsDevTools";

/**
 * 시즌·손님·이벤트 저장 슬롯(표시 중심).
 * 실제 보상 룰은 후속 연결.
 */
export function LiveOpsPlaceholderSection() {
  return (
    <div className="space-y-5">
      <section aria-labelledby="liveops-season">
        <h2
          id="liveops-season"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60"
        >
          출시 후 예정 메모
        </h2>
        <Card className="border border-coffee-600/8 bg-cream-50/90 p-4 shadow-card">
          <p className="text-sm leading-relaxed text-coffee-800">
            시즌 패스, 프리미엄 트랙, 시즌 XP 보상은 현재 저장 슬롯만 준비된 상태예요.
            1.0 일반 노출에서는 열지 않고, 출시 후 예정 메모로만 남겨 둡니다.
          </p>
        </Card>
      </section>

      <section aria-labelledby="liveops-guests">
        <h2
          id="liveops-guests"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60"
        >
          특별 손님 확장
        </h2>
        <Card className="border border-coffee-600/8 bg-cream-50/90 p-4 shadow-card">
          <p className="text-sm leading-relaxed text-coffee-800">
            특별 손님, 확장형 관계 메타, 이벤트 손님 표면은 1.0 포함 범위가 아닙니다.
            현재는 이후 연결을 위한 자리만 남겨 둡니다.
          </p>
        </Card>
      </section>

      <section aria-labelledby="liveops-events">
        <h2
          id="liveops-events"
          className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60"
        >
          계절 이벤트
        </h2>
        <Card className="border border-coffee-600/8 bg-cream-50/90 p-4 shadow-card">
          <p className="text-sm leading-relaxed text-coffee-800">
            시즌 이벤트, liveOps 운영, 이벤트 토큰 구조는 1.0 출시 후 예정입니다.
            일반 유저에게는 활성 기능처럼 보이지 않게 유지합니다.
          </p>
        </Card>
      </section>

      <p className="text-center text-xs leading-relaxed text-coffee-600/75">
        이 영역은 향후 Figma 교체와 함께 다시 열 수 있는 비출시 메모 표면입니다.
      </p>

      <LiveOpsDevTools />
    </div>
  );
}
