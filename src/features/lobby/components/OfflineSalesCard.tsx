"use client";

import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";

export function OfflineSalesCard() {
  const cafe = useAppStore((s) => s.cafeState);
  if (cafe.lastOfflineSaleAtMs === 0 || cafe.lastOfflineSaleCoins <= 0) return null;

  return (
    <Card className="mb-4 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
        오프라인 정산
      </div>
      <p className="mt-2 text-sm text-coffee-800">
        잠깐 자리를 비운 사이{" "}
        <span className="font-semibold tabular-nums text-coffee-900">
          {cafe.lastOfflineSaleSoldCount}
        </span>
        잔이 팔려서{" "}
        <span className="font-semibold tabular-nums text-coffee-900">
          +{cafe.lastOfflineSaleCoins}
        </span>
        코인이 들어왔어요.
      </p>
    </Card>
  );
}

