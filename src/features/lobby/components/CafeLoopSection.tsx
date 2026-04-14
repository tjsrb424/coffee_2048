"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import {
  CAFE_ECONOMY,
  MENU_LABEL,
  MENU_ORDER,
  MENU_UNLOCK_CAFE_LEVEL,
} from "@/features/meta/balance/cafeEconomy";
import type { DrinkMenuId } from "@/features/meta/types/gameState";
import { useAppStore } from "@/stores/useAppStore";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { cn } from "@/lib/utils";

export function CafeLoopSection() {
  const beans = useAppStore((s) => s.playerResources.beans);
  const cafe = useAppStore((s) => s.cafeState);
  const shots = useAppStore((s) => s.cafeState.espressoShots);
  const menuStock = useAppStore((s) => s.cafeState.menuStock);
  const lastAuto = useAppStore((s) => s.cafeState.lastAutoSellAtMs);
  const roastOnce = useAppStore((s) => s.roastOnce);
  const craftDrink = useAppStore((s) => s.craftDrink);
  const { lightTap } = useGameFeedback();

  const m = getCafeRuntimeModifiers(cafe);
  const canRoast = beans >= m.roastBeanCost && shots < m.maxShots;
  const totalStock =
    menuStock.americano + menuStock.latte + menuStock.affogato;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          로스터
        </div>
        <p className="mt-2 text-sm text-coffee-800">
          원두 {m.roastBeanCost}단을 쓰면 추출 베이스가 {m.shotYield}샷 쌓여요.
          (최대 {m.maxShots}샷)
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-coffee-900">
            베이스{" "}
            <span className="tabular-nums text-coffee-700">{shots}</span>
            샷
          </div>
          <Button
            type="button"
            variant="soft"
            disabled={!canRoast}
            onClick={() => {
              lightTap();
              roastOnce();
            }}
          >
            로스팅
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
              메뉴 제작
            </div>
            <p className="mt-2 text-sm text-coffee-800">
              샷과 원두로 잔을 채우면 진열 재고가 늘어요.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {MENU_ORDER.map((id) => (
            <MenuCraftRow
              key={id}
              id={id}
              stock={menuStock[id]}
              locked={cafe.cafeLevel < (MENU_UNLOCK_CAFE_LEVEL[id] ?? 1)}
              requiredCafeLevel={MENU_UNLOCK_CAFE_LEVEL[id] ?? 1}
              shotsOk={shots >= CAFE_ECONOMY.recipe[id].shots}
              beansOk={beans >= CAFE_ECONOMY.recipe[id].beans}
              onCraft={() => {
                lightTap();
                craftDrink(id);
              }}
            />
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          진열 · 자동 판매
        </div>
        <p className="mt-2 text-sm text-coffee-800">
          약 {(m.autoSellIntervalMs / 1000).toFixed(1)}초마다 손님이 한 잔
          가져가요. 아메 → 라떼 → 아포 순으로 비어 있는 잔을 집어요.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {MENU_ORDER.map((id) => (
            <div
              key={id}
              className="rounded-2xl bg-cream-200/70 px-2 py-3 ring-1 ring-coffee-600/5"
            >
              <div className="text-[11px] font-semibold text-coffee-600/70">
                {MENU_LABEL[id]}
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
                {menuStock[id]}
              </div>
              <div className="mt-1 text-[10px] text-coffee-600/60">
                +{CAFE_ECONOMY.sellPrice[id] + m.sellBonus}코인
              </div>
            </div>
          ))}
        </div>
        <motion.p
          className="mt-3 text-center text-xs text-coffee-600/70"
          key={lastAuto + totalStock}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
        >
          진열 합계{" "}
          <span className="font-semibold tabular-nums text-coffee-800">
            {totalStock}
          </span>
          잔
        </motion.p>
      </Card>
    </div>
  );
}

function MenuCraftRow({
  id,
  stock,
  locked,
  requiredCafeLevel,
  shotsOk,
  beansOk,
  onCraft,
}: {
  id: DrinkMenuId;
  stock: number;
  locked: boolean;
  requiredCafeLevel: number;
  shotsOk: boolean;
  beansOk: boolean;
  onCraft: () => void;
}) {
  const rec = CAFE_ECONOMY.recipe[id];
  const can = !locked && shotsOk && beansOk;
  const costLine =
    rec.beans > 0
      ? `샷 ${rec.shots} · 원두 ${rec.beans}`
      : `샷 ${rec.shots}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream-200/50 px-3 py-2 ring-1 ring-coffee-600/5">
      <div>
        <div className="text-sm font-semibold text-coffee-900">
          {MENU_LABEL[id]}
        </div>
        <div className="mt-0.5 text-xs text-coffee-600/80">
          {locked ? `카페 Lv.${requiredCafeLevel}에 해금` : costLine}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-coffee-600/70">재고 {stock}</span>
        <Button
          type="button"
          variant="ghost"
          className={cn("min-h-[40px] px-3 py-2 text-sm")}
          disabled={!can}
          onClick={onCraft}
        >
          {locked ? "잠김" : "제작"}
        </Button>
      </div>
    </li>
  );
}
