"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LOBBY_COPY } from "@/features/meta/balance/constants";
import { useAppStore } from "@/stores/useAppStore";
import { useGameFeedback } from "@/hooks/useGameFeedback";

export function LobbyMainCard() {
  const router = useRouter();
  const cafe = useAppStore((s) => s.cafeState);
  const beans = useAppStore((s) => s.playerResources.beans);
  const { lightTap } = useGameFeedback();

  return (
    <Card className="relative mb-5 overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-soft/20 blur-2xl"
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          오늘의 카페
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-coffee-900">
          Lv.{cafe.cafeLevel} 매장
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-coffee-700">
          {LOBBY_COPY.cafeSummary} 원두 {beans}단이 조용히 숙성 중이에요.
        </p>
        <div className="mt-5">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              lightTap();
              router.push("/puzzle");
            }}
          >
            퍼즐 시작
          </Button>
        </div>
      </div>
    </Card>
  );
}
