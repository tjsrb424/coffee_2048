"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import {
  SESSION_TARGET_HIGHEST_TILE,
  isSessionGoalMet,
} from "@/features/meta/balance/sessionGoals";
import type { PuzzleRewards } from "@/features/meta/rewards/computePuzzleRewards";

export type SessionResultPayload = {
  score: number;
  highestTile: number;
  mergeCount: number;
  rewards: PuzzleRewards;
};

type Props = {
  open: boolean;
  payload: SessionResultPayload | null;
  adSupported: boolean;
  claimMode: "idle" | "base" | "ad";
  notice?: string | null;
  onClaimBase: () => void;
  onClaimDouble: () => void;
};

export function SessionResultModal({
  open,
  payload,
  adSupported,
  claimMode,
  notice,
  onClaimBase,
  onClaimDouble,
}: Props) {
  const goalMet = payload ? isSessionGoalMet(payload.highestTile) : false;
  const showHeartReward = !!payload && payload.rewards.hearts > 0;

  return (
    <AnimatePresence>
      {open && payload && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-coffee-900/45 px-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="w-full max-w-sm rounded-3xl bg-cream-50 p-6 shadow-lift ring-1 ring-coffee-600/15"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-result-title"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
              이번 판 결과
            </p>
            <h2
              id="session-result-title"
              className="mt-1 text-2xl font-bold tracking-tight text-coffee-900"
            >
              수고했어요
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-cream-200/80 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-600/70">점수</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-coffee-900">
                  {payload.score}
                </div>
              </div>
              <div className="rounded-2xl bg-cream-200/80 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-600/70">최고 타일</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-coffee-900">
                  {payload.highestTile}
                </div>
              </div>
            </div>

            <div
              className={`mt-3 rounded-2xl px-3 py-2.5 text-sm font-semibold ring-1 ${
                goalMet
                  ? "bg-accent-mint/25 text-coffee-900 ring-accent-mint/45"
                  : "bg-cream-200/70 text-coffee-700 ring-coffee-600/10"
              }`}
            >
              목표 타일 {SESSION_TARGET_HIGHEST_TILE}:{" "}
              {goalMet ? "달성했어요" : "아쉽지만 다음 기회에"}
            </div>

            <div className="mt-4 rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
              <div className="text-xs font-semibold text-coffee-600/70">
                로비에 들어오면 적용
              </div>
              <div
                className={`mt-2 grid gap-2 text-center ${
                  showHeartReward ? "grid-cols-3" : "grid-cols-2"
                }`}
              >
                <div className="rounded-2xl bg-cream-50/70 px-2 py-3 ring-1 ring-coffee-600/10">
                  <div className="flex h-6 items-center justify-center">
                    <CoinIcon size={24} className="h-6 w-6 opacity-95" />
                    <span className="sr-only">코인</span>
                  </div>
                  <div className="mt-1.5 text-lg font-bold leading-none tabular-nums text-accent-soft">
                    +{payload.rewards.coins}
                  </div>
                </div>
                <div className="rounded-2xl bg-cream-50/70 px-2 py-3 ring-1 ring-coffee-600/10">
                  <div className="flex h-6 items-center justify-center">
                    <BeanIcon size={24} className="h-6 w-6 opacity-95" />
                    <span className="sr-only">원두</span>
                  </div>
                  <div className="mt-1.5 text-lg font-bold leading-none tabular-nums text-accent-mint">
                    +{payload.rewards.beans}
                  </div>
                </div>
                {showHeartReward ? (
                  <div className="rounded-2xl bg-cream-50/70 px-2 py-3 ring-1 ring-coffee-600/10">
                    <div className="flex h-6 items-center justify-center">
                      <HeartIcon size={24} className="h-6 w-6 opacity-95" />
                      <span className="sr-only">하트</span>
                    </div>
                    <div className="mt-1.5 text-lg font-bold leading-none tabular-nums text-coffee-900">
                      +{payload.rewards.hearts}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-coffee-600/85">
              {adSupported
                ? "광고 x2는 코인과 원두만 2배예요. 하트와 다른 메타 진척은 그대로예요."
                : "이 환경에서는 광고 x2를 사용할 수 없어요. 기본 보상으로 진행해 주세요."}
            </p>

            {notice ? (
              <p className="mt-3 text-xs leading-relaxed text-coffee-700">{notice}</p>
            ) : null}

            <div className="mt-5 grid gap-2">
              <Button
                type="button"
                disabled={claimMode !== "idle"}
                onClick={onClaimBase}
              >
                {claimMode === "base" ? "받는 중..." : "기본 받기"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={claimMode !== "idle" || !adSupported}
                onClick={onClaimDouble}
              >
                {claimMode === "ad"
                  ? "광고 확인 중..."
                  : adSupported
                    ? "광고 보고 코인+원두 x2"
                    : "광고 x2 사용 불가"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
