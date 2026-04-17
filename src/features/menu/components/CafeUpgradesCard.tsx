"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoinIcon } from "@/components/ui/CoinIcon";
import {
  type CafeUpgradeTrack,
  CAFE_UPGRADE_MAX_LEVEL,
  getCafeRuntimeModifiers,
  upgradeCost,
} from "@/features/meta/balance/cafeModifiers";
import type { CafeState } from "@/features/meta/types/gameState";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { useAppStore } from "@/stores/useAppStore";

const TRACK_META: Record<CafeUpgradeTrack, { title: string; blurb: string }> = {
  roast: {
    title: "로스팅 설비",
    blurb: "원두 소모·샷 입고·최대 샷이 좋아져요.",
  },
  display: {
    title: "진열 · 쇼케이스",
    blurb: "판매 세션당 한 번에 처리할 틱이 늘고, 잔당 보너스 코인이 붙어요.",
  },
  ambiance: {
    title: "분위기 · 라운지",
    blurb: "손님이 잔을 집는 간격이 조금 빨라져요.",
  },
};

export function CafeUpgradesCard() {
  const coins = useAppStore((s) => s.playerResources.coins);
  const cafe = useAppStore((s) => s.cafeState);
  const purchase = useAppStore((s) => s.purchaseCafeUpgrade);
  const { lightTap } = useGameFeedback();
  const m = getCafeRuntimeModifiers(cafe);

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-sm font-bold text-coffee-900">설비 업그레이드</h2>
        <p className="mt-2 text-sm leading-relaxed text-coffee-700">
          세 트랙을 올리면 수치 보정과 매장 레벨이 함께 반영돼요.
        </p>
      </div>

      <div className="rounded-2xl bg-cream-200/50 px-3 py-2 text-xs text-coffee-700 ring-1 ring-coffee-600/5">
        현재 보정 — 로스팅 원두 {m.roastBeanCost}단 / 샷 +{m.shotYield} / 최대 {m.maxShots}샷 ·
        판매 간격 약 {(m.autoSellIntervalMs / 1000).toFixed(1)}초(개시 후) · 판매 보너스 +
        <span className="inline-flex items-center gap-0.5 align-middle">
          <CoinIcon size={14} className="opacity-95" />
          {m.sellBonus}
          <span className="sr-only">코인</span>
        </span>
      </div>

      <ul className="space-y-3">
        {(Object.keys(TRACK_META) as CafeUpgradeTrack[]).map((track) => (
          <UpgradeRow
            key={track}
            track={track}
            coins={coins}
            cafe={cafe}
            onBuy={() => {
              lightTap();
              purchase(track);
            }}
          />
        ))}
      </ul>
    </Card>
  );
}

function UpgradeRow({
  track,
  coins,
  cafe,
  onBuy,
}: {
  track: CafeUpgradeTrack;
  coins: number;
  cafe: CafeState;
  onBuy: () => void;
}) {
  const meta = TRACK_META[track];
  const key =
    track === "roast"
      ? "roastLevel"
      : track === "display"
        ? "displayLevel"
        : "ambianceLevel";
  const level = cafe[key];
  const cost = upgradeCost(track, level);
  const maxed = level >= CAFE_UPGRADE_MAX_LEVEL;
  const canBuy = !maxed && coins >= cost;

  return (
    <li className="rounded-2xl bg-cream-200/40 px-3 py-3 ring-1 ring-coffee-600/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-coffee-900">{meta.title}</div>
          <p className="mt-1 text-xs leading-relaxed text-coffee-700">
            {meta.blurb}
          </p>
          <p className="mt-2 text-xs font-medium text-coffee-600/80">
            Lv.{level}
            {maxed ? " · 만렙" : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="soft"
          className="min-h-[44px] shrink-0 px-4"
          disabled={!canBuy}
          onClick={onBuy}
        >
          {maxed ? (
            "만렙"
          ) : (
            <span className="inline-flex items-center gap-1">
              <CoinIcon size={16} className="opacity-95" />
              {cost}
              <span className="sr-only">코인</span>
            </span>
          )}
        </Button>
      </div>
    </li>
  );
}
