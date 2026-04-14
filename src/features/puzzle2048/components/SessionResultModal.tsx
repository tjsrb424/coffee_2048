"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import {
  SESSION_TARGET_HIGHEST_TILE,
  isSessionGoalMet,
} from "@/features/meta/balance/sessionGoals";
import type { PuzzleRewards } from "@/features/meta/rewards/computePuzzleRewards";

export type SessionResultPayload = {
  score: number;
  highestTile: number;
  rewards: PuzzleRewards;
};

type Props = {
  open: boolean;
  payload: SessionResultPayload | null;
  showRetry: boolean;
  onConfirmLobby: () => void;
  onRetry?: () => void;
  /** 나가기로 연 경우, 로비 없이 모달만 닫기 */
  onDismiss?: () => void;
};

export function SessionResultModal({
  open,
  payload,
  showRetry,
  onConfirmLobby,
  onRetry,
  onDismiss,
}: Props) {
  const goalMet = payload ? isSessionGoalMet(payload.highestTile) : false;

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
              <div className="text-xs font-semibold text-coffee-600/70">획득 예정</div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold tabular-nums text-coffee-900">
                <span>코인 +{payload.rewards.coins}</span>
                <span>원두 +{payload.rewards.beans}</span>
                <span>하트 +{payload.rewards.hearts}</span>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-coffee-600/85">
              로비로 가면 위 보상이 적용돼요.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <Button type="button" onClick={onConfirmLobby}>
                로비로
              </Button>
              {showRetry && onRetry && (
                <Button type="button" variant="ghost" onClick={onRetry}>
                  다시 하기
                </Button>
              )}
              {!showRetry && onDismiss && (
                <Button type="button" variant="ghost" onClick={onDismiss}>
                  닫고 계속
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
