"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import {
  getRewardedAdAvailability,
  preloadRewardedAdRuntime,
  type RewardedAdStatus,
  requestRewardedAd,
} from "@/lib/ads/rewardedAds";
import { runSceneTransition } from "@/lib/runSceneTransition";
import { useAppStore } from "@/stores/useAppStore";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";
import { useLockDocumentScroll } from "../hooks/useLockDocumentScroll";
import { usePreventTouchScroll } from "../hooks/usePreventTouchScroll";
import { usePuzzleKeyboard } from "../hooks/usePuzzleKeyboard";
import { useSwipe } from "../hooks/useSwipe";
import type { PendingPuzzleRewardClaim } from "@/features/meta/types/gameState";
import {
  readPuzzleOutcomeFromState,
  usePuzzleSessionStore,
} from "../store/usePuzzleSessionStore";
import type { Direction } from "../types";
import { PuzzleBoard } from "./PuzzleBoard";
import { PuzzleHud } from "./PuzzleHud";
import { RewardPreview } from "./RewardPreview";
import { SessionGoalChip } from "./SessionGoalChip";
import {
  SessionResultModal,
  type SessionResultPayload,
} from "./SessionResultModal";

function payloadFromPendingClaim(
  claim: PendingPuzzleRewardClaim,
): SessionResultPayload {
  return {
    score: claim.score,
    highestTile: claim.highestTile,
    mergeCount: claim.mergeCount,
    rewards: {
      coins: claim.baseCoins,
      beans: claim.baseBeans,
      hearts: claim.baseHearts,
    },
  };
}

export function PuzzleScreen() {
  const router = useRouter();
  const startFresh = usePuzzleSessionStore((s) => s.startFresh);
  const tryMove = usePuzzleSessionStore((s) => s.tryMove);
  const gameOver = usePuzzleSessionStore((s) => s.gameOver);
  const inputLocked = usePuzzleSessionStore((s) => s.inputLocked);
  const pendingPuzzleRewardClaim = useAppStore(
    (s) => s.meta.pendingPuzzleRewardClaim,
  );
  const preparePuzzleRewardClaim = useAppStore((s) => s.preparePuzzleRewardClaim);
  const claimPuzzleReward = useAppStore((s) => s.claimPuzzleReward);
  const hearts = useAppStore((s) => s.playerResources.hearts);
  const bestScoreMeta = useAppStore((s) => s.puzzleProgress.bestScore);
  const { lightTap, mergePulse, moveWhoosh } = useGameFeedback();

  const [paused, setPaused] = useState(false);
  const [noHeartOpen, setNoHeartOpen] = useState(false);
  const [claimMode, setClaimMode] = useState<"idle" | "base" | "ad">("idle");
  const [claimNotice, setClaimNotice] = useState<string | null>(null);

  const gestureRef = usePreventTouchScroll();
  const gameOverResultShownRef = useRef(false);
  const resultPayload = pendingPuzzleRewardClaim
    ? payloadFromPendingClaim(pendingPuzzleRewardClaim)
    : null;
  const resultOpen = !!resultPayload;
  const puzzleRewardAdAvailability = getRewardedAdAvailability(
    "puzzle_result_double",
  );
  const puzzleRewardAdSupported = puzzleRewardAdAvailability.isSupported;

  const noticeForAdResult = useCallback((status: RewardedAdStatus) => {
    switch (status) {
      case "cancelled":
        return "광고 보상을 끝까지 받지 못했어요. 기본 보상은 바로 받을 수 있어요.";
      case "timeout":
        return "광고 응답이 시간 안에 끝나지 않았어요. 잠시 뒤 다시 시도하거나 기본 보상을 받아주세요.";
      case "no_fill":
        return "지금은 볼 수 있는 광고가 없어요. 기본 보상은 바로 받을 수 있어요.";
      case "unsupported":
        return "이번 요청에서는 보상형 광고를 열지 못했어요. 잠시 뒤 다시 시도하거나 기본 보상을 받아주세요.";
      case "error":
      default:
        return "광고를 지금 준비하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
    }
  }, []);

  useLockDocumentScroll(true);

  useEffect(() => {
    router.prefetch("/lobby");
  }, [router]);

  useEffect(() => {
    if (puzzleRewardAdAvailability.providerMode !== "web-gpt-rewarded") return;
    void preloadRewardedAdRuntime();
  }, [puzzleRewardAdAvailability.providerMode]);

  useEffect(() => {
    if (pendingPuzzleRewardClaim) {
      setPaused(false);
      setNoHeartOpen(false);
      return;
    }
    if (hearts <= 0) {
      setNoHeartOpen(true);
      return;
    }
    gameOverResultShownRef.current = false;
    setClaimMode("idle");
    setClaimNotice(null);
    startFresh();
  }, [hearts, pendingPuzzleRewardClaim, startFresh]);

  const openLeaveResult = useCallback(() => {
    if (pendingPuzzleRewardClaim) return;
    const { score, highestTile, mergeCount } = readPuzzleOutcomeFromState(
      usePuzzleSessionStore.getState(),
    );
    preparePuzzleRewardClaim({
      score,
      highestTile,
      mergeCount,
    });
    setClaimNotice(null);
    setPaused(false);
  }, [pendingPuzzleRewardClaim, preparePuzzleRewardClaim]);

  useEffect(() => {
    if (
      gameOver &&
      !gameOverResultShownRef.current &&
      !pendingPuzzleRewardClaim
    ) {
      const { score, highestTile, mergeCount } = readPuzzleOutcomeFromState(
        usePuzzleSessionStore.getState(),
      );
      gameOverResultShownRef.current = true;
      preparePuzzleRewardClaim({
        score,
        highestTile,
        mergeCount,
      });
      setClaimNotice(null);
      setPaused(false);
    }
    if (!gameOver && !pendingPuzzleRewardClaim) {
      gameOverResultShownRef.current = false;
    }
  }, [gameOver, pendingPuzzleRewardClaim, preparePuzzleRewardClaim]);

  const completeClaimAndGoLobby = useCallback(
    (rewards: SessionResultPayload["rewards"]) => {
      setClaimMode("idle");
      setClaimNotice(null);
      setPaused(false);
      setNoHeartOpen(false);
      gameOverResultShownRef.current = false;
      const fxStore = useLobbyFxStore.getState();
      fxStore.setPuzzleHotspotHints({
        roast: rewards.beans > 0,
        counter: rewards.coins > 0,
      });
      fxStore.pingPuzzleRewards(rewards);
      runSceneTransition(() => router.push("/lobby"), "/lobby");
    },
    [router],
  );

  const claimCurrentPuzzleReward = useCallback(
    (doubled: boolean) => {
      if (!pendingPuzzleRewardClaim) return null;
      const claimed = claimPuzzleReward({
        claimId: pendingPuzzleRewardClaim.claimId,
        doubled,
      });
      if (!claimed) {
        setClaimMode("idle");
        setClaimNotice("이미 정산된 결과예요.");
        return null;
      }
      completeClaimAndGoLobby(claimed.rewards);
      return claimed;
    },
    [claimPuzzleReward, completeClaimAndGoLobby, pendingPuzzleRewardClaim],
  );

  const claimBaseReward = useCallback(() => {
    if (claimMode !== "idle") return;
    setClaimMode("base");
    setClaimNotice(null);
    claimCurrentPuzzleReward(false);
  }, [claimCurrentPuzzleReward, claimMode]);

  const claimDoubleReward = useCallback(async () => {
    if (claimMode !== "idle" || !pendingPuzzleRewardClaim) return;
    if (!getRewardedAdAvailability("puzzle_result_double").isSupported) {
      setClaimMode("idle");
      setClaimNotice(noticeForAdResult("unsupported"));
      return;
    }
    setClaimMode("ad");
    setClaimNotice(null);
    const result = await requestRewardedAd("puzzle_result_double");
    if (result.status !== "rewarded") {
      setClaimMode("idle");
      setClaimNotice(noticeForAdResult(result.status));
      return;
    }
    claimCurrentPuzzleReward(true);
  }, [claimCurrentPuzzleReward, claimMode, noticeForAdResult, pendingPuzzleRewardClaim]);

  const onDirection = useCallback(
    (dir: Direction) => {
      if (paused || gameOver || resultOpen) return;
      const before = usePuzzleSessionStore.getState();
      tryMove(dir);
      const after = usePuzzleSessionStore.getState();
      if (after.board === before.board) return;
      moveWhoosh();
      if (after.lastMergeCount > 0) mergePulse();
    },
    [gameOver, mergePulse, moveWhoosh, paused, resultOpen, tryMove],
  );

  const swipe = useSwipe({ onSwipe: onDirection });
  usePuzzleKeyboard({
    enabled: !paused && !gameOver && !resultOpen,
    onDirection,
  });

  const mergeCount = usePuzzleSessionStore((s) => s.lastMergeCount);

  return (
    <div className="flex h-[100svh] max-h-[100svh] flex-col overflow-hidden sm:h-[100dvh] sm:max-h-[100dvh]">
      <AppShell className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-4 sm:pb-36 sm:pt-6">
        <header className="mb-2 flex shrink-0 touch-auto items-center justify-between gap-2 sm:mb-3 sm:gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-coffee-600/60 sm:text-xs">
              Puzzle
            </p>
            <h1 className="text-xl font-bold tracking-tight text-coffee-900 sm:text-2xl">
              2048
            </h1>
          </div>
          <div className="flex shrink-0 gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="soft"
              className="min-h-10 touch-auto px-3 text-xs sm:min-h-[44px] sm:px-4 sm:text-sm"
              onClick={() => {
                lightTap();
                setPaused(true);
              }}
            >
              일시정지
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="min-h-10 touch-auto px-3 text-xs sm:min-h-[44px] sm:px-4 sm:text-sm"
              onClick={() => {
                lightTap();
                openLeaveResult();
              }}
            >
              나가기
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overscroll-contain">
          <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-hidden sm:gap-4">
            <SessionGoalChip />
            <PuzzleHud bestScoreMeta={bestScoreMeta} />
            <div className="relative z-[1] shrink-0">
              <RewardPreview />
            </div>
            <div
              ref={gestureRef}
              data-testid="puzzle-gesture-surface"
              className="relative z-0 flex min-h-0 min-w-0 flex-1 touch-none flex-col"
              onPointerDown={swipe.onPointerDown}
              onPointerUp={swipe.onPointerUp}
              onPointerCancel={swipe.onPointerCancel}
              onTouchStart={swipe.onTouchStart}
              onTouchEnd={swipe.onTouchEnd}
              onTouchCancel={swipe.onTouchCancel}
            >
              <div className="relative mx-auto flex h-full min-h-0 w-full max-w-[21rem] min-w-0">
                <AnimatePresence>
                  {mergeCount > 1 && !paused && !resultOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 max-w-[92%] -translate-x-1/2 rounded-full bg-accent-mint/30 px-2.5 py-1 text-center text-[10px] font-semibold leading-tight text-coffee-900 shadow-sm ring-1 ring-accent-mint/40 sm:mb-2 sm:px-3 sm:py-1.5 sm:text-[11px]"
                    >
                      한 번에 여러 합치기!
                    </motion.div>
                  )}
                </AnimatePresence>
                <PuzzleBoard />
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {inputLocked && (
        <div
          className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-3 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.25rem)",
          }}
          aria-live="polite"
        >
          <p className="w-full max-w-[20rem] rounded-full bg-cream-50/95 px-3 py-2 text-center text-[11px] leading-snug text-coffee-700 shadow-md ring-1 ring-coffee-600/15 backdrop-blur-sm">
            잠깐만요, 타일이 갓 구워진 느낌으로 정렬 중이에요.
          </p>
        </div>
      )}

      <AnimatePresence>
        {paused && !resultOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-coffee-900/35 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="w-full max-w-sm rounded-3xl bg-cream-50 p-6 shadow-lift ring-1 ring-coffee-600/15"
            >
              <h2 className="text-xl font-bold text-coffee-900">잠시 멈춤</h2>
              <p className="mt-2 text-sm leading-relaxed text-coffee-700">
                숨 고르고, 다시 스와이프해도 좋아요.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    lightTap();
                    setPaused(false);
                  }}
                >
                  계속하기
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    lightTap();
                    openLeaveResult();
                  }}
                >
                  로비로 (결과 보기)
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SessionResultModal
        open={resultOpen}
        payload={resultPayload}
        adSupported={puzzleRewardAdSupported}
        claimMode={claimMode}
        notice={claimNotice}
        onClaimBase={claimBaseReward}
        onClaimDouble={claimDoubleReward}
      />

      <AnimatePresence>
        {noHeartOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-coffee-900/45 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 6 }}
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className="w-full max-w-sm rounded-3xl bg-cream-50 p-6 shadow-lift ring-1 ring-coffee-600/15"
              role="dialog"
              aria-modal="true"
              aria-labelledby="no-heart-title"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
                Puzzle
              </p>
              <h2
                id="no-heart-title"
                className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-coffee-900"
              >
                <HeartIcon size={28} className="shrink-0 opacity-95" />
                하트가 부족해요
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-coffee-700">
                지금은 퍼즐을 시작할 수 없어요. 로비로 돌아가서 준비해볼까요?
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    lightTap();
                    setNoHeartOpen(false);
                    runSceneTransition(() => router.push("/lobby"), "/lobby");
                  }}
                >
                  로비로
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    lightTap();
                    setNoHeartOpen(false);
                  }}
                >
                  닫기
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
