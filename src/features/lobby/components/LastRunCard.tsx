"use client";

import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";

export function LastRunCard() {
  const p = useAppStore((s) => s.puzzleProgress);
  const hasRun = p.totalRuns > 0;

  if (!hasRun) {
    return (
      <Card className="mb-4">
        <h3 className="text-sm font-bold text-coffee-900">최근 퍼즐</h3>
        <p className="mt-2 text-sm leading-relaxed text-coffee-700">
          아직 기록이 없어요. 퍼즐로 첫 온기를 남겨볼까요?
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <h3 className="text-sm font-bold text-coffee-900">최근 퍼즐</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs font-semibold text-coffee-600/70">점수</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
            {p.lastRunScore}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-coffee-600/70">최고 타일</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
            {p.lastRunTile}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-coffee-600/70">획득 코인</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-accent-soft">
            +{p.lastRunCoins}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-coffee-600/70">획득 원두</div>
          <div className="mt-1 text-lg font-bold tabular-nums text-accent-mint">
            +{p.lastRunBeans}
          </div>
        </div>
      </div>
      {p.lastRunHearts > 0 && (
        <p className="mt-3 text-xs font-semibold text-coffee-700">
          하트 보너스 +{p.lastRunHearts}
        </p>
      )}
    </Card>
  );
}
