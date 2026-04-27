"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { Button } from "@/components/ui/Button";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import {
  SESSION_TARGET_HIGHEST_TILE,
  isSessionGoalMet,
} from "@/features/meta/balance/sessionGoals";
import { computePuzzleRewards } from "@/features/meta/rewards/computePuzzleRewards";
import {
  getRewardedAdAvailability,
  preloadRewardedAdRuntime,
  type RewardedAdStatus,
  requestRewardedAd,
} from "@/lib/ads/rewardedAds";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { runSceneTransition } from "@/lib/runSceneTransition";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";
import { getHighestTileValue } from "@/features/puzzle2048/engine";
import { useLockDocumentScroll } from "../hooks/useLockDocumentScroll";
import { usePreventTouchScroll } from "../hooks/usePreventTouchScroll";
import { usePuzzleKeyboard } from "../hooks/usePuzzleKeyboard";
import { useSwipe } from "../hooks/useSwipe";
import type { PendingPuzzleRewardClaim } from "@/features/meta/types/gameState";
import {
  INGAME_IMAGE_PATHS,
  mergePuzzleLayoutPatch,
  PUZZLE_LAYOUT_KEYS,
  PUZZLE_LAYOUT_VERSION,
  puzzleLayout,
  puzzleLayoutItemStyle,
  type PuzzleLayout,
  type PuzzleLayoutItem,
  type PuzzleLayoutKey,
} from "../config/puzzleLayout";
import {
  readPuzzleOutcomeFromState,
  usePuzzleSessionStore,
} from "../store/usePuzzleSessionStore";
import type { Direction } from "../types";
import { PuzzleBoard } from "./PuzzleBoard";
import { PuzzleTuningPanel } from "./PuzzleTuningPanel";
import {
  SessionResultModal,
  type SessionResultPayload,
} from "./SessionResultModal";

const ASSET = {
  bg: publicAssetPath(INGAME_IMAGE_PATHS.bgBase),
  ref: publicAssetPath(INGAME_IMAGE_PATHS.reference),
  title: publicAssetPath(INGAME_IMAGE_PATHS.titleLogo),
  out: publicAssetPath(INGAME_IMAGE_PATHS.btnOut),
  goal: publicAssetPath(INGAME_IMAGE_PATHS.hudGoalScore),
  score: publicAssetPath(INGAME_IMAGE_PATHS.hudScore),
  bestScore: publicAssetPath(INGAME_IMAGE_PATHS.hudBestScore),
  bestTile: publicAssetPath(INGAME_IMAGE_PATHS.hudBestTile),
  reward: publicAssetPath(INGAME_IMAGE_PATHS.hudReward),
  mid: publicAssetPath(INGAME_IMAGE_PATHS.hudMid),
  frame: publicAssetPath(INGAME_IMAGE_PATHS.hudPuzzleFrame),
  bottom: publicAssetPath(INGAME_IMAGE_PATHS.hudBottom),
} as const;

const PUZZLE_TUNING_LAYOUT_STORAGE_KEY = "coffee2048_puzzle_tuning_layout" as const;
const PUZZLE_OVERLAY_STORAGE_KEY = "coffee2048_puzzle_overlay" as const;
const PUZZLE_OVERLAY_OPACITY_STORAGE_KEY =
  "coffee2048_puzzle_overlay_opacity" as const;
const DEFAULT_PUZZLE_OVERLAY_OPACITY = 0.35;

type StoredPuzzleTuningLayout = {
  version: number;
  layout: unknown;
};

function clampOpacity(value: number) {
  return Math.min(1, Math.max(0.05, value));
}

function isLocalhostDevHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

function parseStoredLayout(): PuzzleLayout {
  if (typeof window === "undefined") return puzzleLayout;
  try {
    const stored = window.localStorage.getItem(PUZZLE_TUNING_LAYOUT_STORAGE_KEY);
    if (!stored) return puzzleLayout;
    const parsed = JSON.parse(stored) as StoredPuzzleTuningLayout;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== PUZZLE_LAYOUT_VERSION ||
      !parsed.layout ||
      typeof parsed.layout !== "object"
    ) {
      window.localStorage.removeItem(PUZZLE_TUNING_LAYOUT_STORAGE_KEY);
      return puzzleLayout;
    }
    const raw = parsed.layout as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const key of PUZZLE_LAYOUT_KEYS) {
      const v = raw[key];
      if (v && typeof v === "object") patch[key] = v;
    }
    return mergePuzzleLayoutPatch(puzzleLayout, patch);
  } catch {
    return puzzleLayout;
  }
}

function persistTunedLayout(layout: PuzzleLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PUZZLE_TUNING_LAYOUT_STORAGE_KEY,
      JSON.stringify({ version: PUZZLE_LAYOUT_VERSION, layout }),
    );
  } catch {
    // dev-only
  }
}

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
  const score = usePuzzleSessionStore((s) => s.score);
  const board = usePuzzleSessionStore((s) => s.board);
  const lastDelta = usePuzzleSessionStore((s) => s.lastScoreDelta);
  const mergeCount = usePuzzleSessionStore((s) => s.lastMergeCount);
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

  const highest = getHighestTileValue(board);
  const goalMet = isSessionGoalMet(highest);
  const bestShown = Math.max(bestScoreMeta, score);
  const rewardPreview = computePuzzleRewards(score, highest);
  const showRewardHeart = rewardPreview.hearts > 0;

  const isNonProductionBuild = process.env.NODE_ENV !== "production";
  const [canUsePuzzleDevTools, setCanUsePuzzleDevTools] =
    useState(isNonProductionBuild);
  const [showPuzzleOverlay, setShowPuzzleOverlay] = useState(false);
  const [puzzleOverlayOpacity, setPuzzleOverlayOpacity] = useState(
    DEFAULT_PUZZLE_OVERLAY_OPACITY,
  );
  const [tunedLayout, setTunedLayout] = useState<PuzzleLayout>(puzzleLayout);
  const [selectedLayoutKey, setSelectedLayoutKey] =
    useState<PuzzleLayoutKey>("boardGrid");
  const [showTuningPanel, setShowTuningPanel] = useState(false);

  useEffect(() => {
    if (isNonProductionBuild) return;
    setCanUsePuzzleDevTools(isLocalhostDevHost());
  }, [isNonProductionBuild]);

  useEffect(() => {
    if (!canUsePuzzleDevTools || typeof window === "undefined") return;
    try {
      const search = new URLSearchParams(window.location.search);
      const queryEnabled = search.get("puzzle_overlay") === "1";
      const queryResetTuning = search.get("puzzle_tuning_reset") === "1";
      const queryOpacityValue = search.get("puzzle_overlay_opacity");
      const queryOpacity =
        queryOpacityValue == null ? Number.NaN : Number(queryOpacityValue);
      const storedEnabled =
        window.localStorage.getItem(PUZZLE_OVERLAY_STORAGE_KEY) === "1";
      const storedOpacityValue = window.localStorage.getItem(
        PUZZLE_OVERLAY_OPACITY_STORAGE_KEY,
      );
      const storedOpacity =
        storedOpacityValue == null ? Number.NaN : Number(storedOpacityValue);
      setShowPuzzleOverlay(queryEnabled || storedEnabled);
      if (Number.isFinite(queryOpacity)) {
        setPuzzleOverlayOpacity(clampOpacity(queryOpacity));
      } else if (Number.isFinite(storedOpacity)) {
        setPuzzleOverlayOpacity(clampOpacity(storedOpacity));
      }
      if (queryResetTuning) {
        window.localStorage.removeItem(PUZZLE_TUNING_LAYOUT_STORAGE_KEY);
        setTunedLayout(puzzleLayout);
      } else {
        setTunedLayout(parseStoredLayout());
      }
    } catch {
      setShowPuzzleOverlay(false);
      setPuzzleOverlayOpacity(DEFAULT_PUZZLE_OVERLAY_OPACITY);
    }
  }, [canUsePuzzleDevTools]);

  const setPuzzleOverlayEnabled = useCallback(
    (enabled: boolean) => {
      if (!canUsePuzzleDevTools || typeof window === "undefined") return;
      try {
        if (enabled) {
          window.localStorage.setItem(PUZZLE_OVERLAY_STORAGE_KEY, "1");
        } else {
          window.localStorage.removeItem(PUZZLE_OVERLAY_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
      setShowPuzzleOverlay(enabled);
    },
    [canUsePuzzleDevTools],
  );

  const changePuzzleOverlayOpacity = useCallback(
    (opacity: number) => {
      if (!canUsePuzzleDevTools || typeof window === "undefined") return;
      const next = clampOpacity(opacity);
      setPuzzleOverlayOpacity(next);
      try {
        window.localStorage.setItem(
          PUZZLE_OVERLAY_OPACITY_STORAGE_KEY,
          String(next),
        );
      } catch {
        // ignore
      }
    },
    [canUsePuzzleDevTools],
  );

  const changeLayoutItem = useCallback(
    (key: PuzzleLayoutKey, patch: Partial<PuzzleLayoutItem>) => {
      if (!canUsePuzzleDevTools) return;
      setTunedLayout((current) => {
        const next = {
          ...current,
          [key]: { ...current[key], ...patch },
        };
        persistTunedLayout(next);
        return next;
      });
    },
    [canUsePuzzleDevTools],
  );

  const resetTunedLayout = useCallback(() => {
    setTunedLayout(puzzleLayout);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PUZZLE_TUNING_LAYOUT_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!canUsePuzzleDevTools) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const direction =
        event.key === "ArrowLeft"
          ? { x: -1, y: 0 }
          : event.key === "ArrowRight"
            ? { x: 1, y: 0 }
            : event.key === "ArrowUp"
              ? { x: 0, y: -1 }
              : event.key === "ArrowDown"
                ? { x: 0, y: 1 }
                : null;
      if (!direction) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "select" ||
        tagName === "textarea" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      changeLayoutItem(selectedLayoutKey, {
        x: tunedLayout[selectedLayoutKey].x + direction.x * step,
        y: tunedLayout[selectedLayoutKey].y + direction.y * step,
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    canUsePuzzleDevTools,
    changeLayoutItem,
    selectedLayoutKey,
    tunedLayout,
  ]);

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
    const { score: s, highestTile, mergeCount } = readPuzzleOutcomeFromState(
      usePuzzleSessionStore.getState(),
    );
    preparePuzzleRewardClaim({
      score: s,
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
      const { score: s, highestTile, mergeCount } = readPuzzleOutcomeFromState(
        usePuzzleSessionStore.getState(),
      );
      gameOverResultShownRef.current = true;
      preparePuzzleRewardClaim({
        score: s,
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

  const L = tunedLayout;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#f6f0e8]">
      <main className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 min-h-0 overflow-x-hidden overflow-y-hidden">
            <PuzzleLayoutSlot item={L.background} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.bg}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 28rem"
                  className="object-cover object-center"
                />
              </div>
            </PuzzleLayoutSlot>

            {canUsePuzzleDevTools && showPuzzleOverlay ? (
              <div
                className="pointer-events-none absolute inset-0 z-[100]"
                style={{ opacity: puzzleOverlayOpacity }}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={ASSET.ref}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 28rem"
                    className="object-contain object-top"
                  />
                </div>
              </div>
            ) : null}

            <PuzzleLayoutSlot item={L.midDecor} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.mid}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 28rem"
                  className="object-contain object-center"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.goalPanel} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.goal}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 24rem"
                  className="object-contain"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.scoreCard} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.score}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 32vw, 8rem"
                  className="object-contain"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bestScoreCard}
              className="pointer-events-none"
            >
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.bestScore}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 32vw, 8rem"
                  className="object-contain"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.bestTileCard} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.bestTile}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 32vw, 8rem"
                  className="object-contain"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.rewardPanel} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.reward}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 92vw, 24rem"
                  className="object-contain"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.puzzleFrame} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.frame}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 88vw, 22rem"
                  className="object-contain object-center"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.boardBacking} className="pointer-events-none">
              <div
                className="h-full w-full rounded-[0.95rem] bg-[#DBC1A4] shadow-[inset_0_2px_10px_rgb(62_42_28_/_0.06)] ring-1 ring-inset ring-coffee-900/10"
                aria-hidden
              />
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.bottomDecor} className="pointer-events-none">
              <div className="relative h-full w-full overflow-visible">
                <Image
                  src={ASSET.bottom}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 28rem"
                  className="object-contain object-bottom"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.titleLogo} className="pointer-events-none">
              <div className="relative h-full w-full">
                <Image
                  src={ASSET.title}
                  alt="Coffee 2048"
                  fill
                  sizes="(max-width: 768px) 48vw, 12rem"
                  className="object-contain object-center drop-shadow-[0_8px_20px_rgb(76_53_37_/_0.15)]"
                />
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.pauseButton}>
              <button
                type="button"
                className="flex h-full w-full touch-auto items-center justify-center rounded-2xl bg-coffee-950/25 text-[11px] font-bold text-white shadow-[0_1px_8px_rgb(0_0_0_/_0.25)] ring-1 ring-white/25 backdrop-blur-[2px] active:scale-[0.98] sm:text-xs"
                onClick={() => {
                  lightTap();
                  setPaused(true);
                }}
              >
                일시정지
              </button>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.exitButton}>
              <button
                type="button"
                aria-label="나가기"
                className="relative block h-full w-full touch-auto overflow-hidden rounded-2xl active:scale-[0.98]"
                onClick={() => {
                  lightTap();
                  openLeaveResult();
                }}
              >
                <Image
                  src={ASSET.out}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 16vw, 4rem"
                  className="object-contain object-center"
                />
              </button>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.goalRibbonText}
              className="pointer-events-none flex items-center"
            >
              <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)] sm:text-xs">
                이번 목표
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.goalText}
              className="pointer-events-none flex items-center justify-center text-center"
            >
              <span className="text-[11px] font-medium tabular-nums text-[#674831] sm:text-xs">
                최고 타일{" "}
                <span className="font-semibold text-[#674831]">
                  {SESSION_TARGET_HIGHEST_TILE}
                </span>
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.currentTileLabel}
              className="pointer-events-none flex items-end justify-center"
            >
              <span className="text-[9px] font-semibold text-[#674831] sm:text-[10px]">
                {goalMet ? "달성" : "현재"}
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.currentTileValue}
              className="pointer-events-none flex items-start justify-center"
            >
              <span className="text-sm font-bold tabular-nums text-[#674831] sm:text-base">
                {goalMet ? "✓" : highest || "—"}
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.scoreLabel}
              className="pointer-events-none flex items-end"
            >
              <span className="text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)] sm:text-[11px]">
                점수
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.scoreValue}
              className="pointer-events-none flex items-center justify-center"
            >
              <div className="relative flex h-full w-full items-center justify-center px-0.5">
                <div className="relative inline-block translate-y-1 sm:translate-y-1.5">
                  <span className="text-center text-lg font-bold tabular-nums text-[#674831] sm:text-2xl">
                    {score}
                  </span>
                  <AnimatePresence>
                    {lastDelta > 0 && (
                      <motion.span
                        key={`${score}-${lastDelta}`}
                        initial={{ opacity: 0, y: 8, scale: 0.9 }}
                        animate={{ opacity: 1, y: -6, scale: 1 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="pointer-events-none absolute left-full top-0 ml-1 whitespace-nowrap text-xs font-semibold text-[#674831] sm:text-sm"
                      >
                        +{lastDelta}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bestScoreLabel}
              className="pointer-events-none flex items-end"
            >
              <span className="text-[10px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)] sm:text-[11px]">
                최고
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bestScoreValue}
              className="pointer-events-none flex items-center justify-center"
            >
              <span className="translate-y-1 text-center text-lg font-bold tabular-nums text-[#674831] sm:translate-y-1.5 sm:text-2xl">
                {bestShown}
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bestTileLabel}
              className="pointer-events-none flex items-center justify-center text-center"
            >
              <span className="whitespace-nowrap text-[9px] font-semibold text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)] sm:text-[10px]">
                최고 타일
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bestTileValue}
              className="pointer-events-none flex items-center justify-center"
            >
              <span className="translate-y-1 text-center text-lg font-bold tabular-nums leading-none text-[#674831] sm:translate-y-1.5 sm:text-2xl">
                {highest}
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.rewardTitle}
              className="pointer-events-none flex items-center justify-center text-center"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)] sm:text-xs">
                예상 보상
              </span>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.rewardCoinValue}>
              <div className="flex h-full w-full items-center justify-center gap-1.5">
                <CoinIcon size={44} className="shrink-0 opacity-95 sm:h-14 sm:w-14" />
                <span className="sr-only">코인</span>
                <span className="text-sm font-bold tabular-nums text-[#674831] sm:text-lg">
                  +{rewardPreview.coins}
                </span>
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.rewardBeanValue}>
              <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                <div className="flex items-center justify-center gap-1.5">
                  <BeanIcon size={44} className="shrink-0 opacity-95 sm:h-14 sm:w-14" />
                  <span className="sr-only">원두</span>
                  <span className="text-sm font-bold tabular-nums text-[#674831] sm:text-lg">
                    +{rewardPreview.beans}
                  </span>
                </div>
                {showRewardHeart ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <HeartIcon size={20} className="shrink-0 opacity-95" />
                    <span className="sr-only">하트</span>
                    <span className="text-xs font-bold tabular-nums text-white drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.45)]">
                      +{rewardPreview.hearts}
                    </span>
                  </div>
                ) : null}
              </div>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot
              item={L.bottomGuideText}
              className="pointer-events-none flex items-start justify-center px-1 text-center"
            >
              <p className="text-[11px] leading-snug text-coffee-700/90 sm:text-xs">
                지금까지의 합류가 곧 매장의 온기로 이어져요.
              </p>
            </PuzzleLayoutSlot>

            <PuzzleLayoutSlot item={L.boardGrid}>
              <div
                ref={gestureRef}
                data-testid="puzzle-gesture-surface"
                className="relative flex h-full w-full touch-none flex-col items-center justify-center overflow-visible"
                onPointerDown={swipe.onPointerDown}
                onPointerUp={swipe.onPointerUp}
                onPointerCancel={swipe.onPointerCancel}
                onTouchStart={swipe.onTouchStart}
                onTouchEnd={swipe.onTouchEnd}
                onTouchCancel={swipe.onTouchCancel}
              >
                <AnimatePresence>
                  {mergeCount > 1 && !paused && !resultOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 max-w-[92%] -translate-x-1/2 rounded-full bg-accent-mint/30 px-2.5 py-1 text-center text-[10px] font-semibold leading-tight text-coffee-900 shadow-sm ring-1 ring-accent-mint/40 sm:mb-2 sm:px-3 sm:py-1.5 sm:text-[11px]"
                    >
                      한 번에 여러 합치기!
                    </motion.div>
                  )}
                </AnimatePresence>
                <PuzzleBoard
                  shellVisual
                  cellStackZ={0}
                  tileStackZ={Math.max(
                    0,
                    L.tileLayer.zIndex - L.boardGrid.zIndex,
                  )}
                />
              </div>
            </PuzzleLayoutSlot>
          </div>
        </div>

        {canUsePuzzleDevTools ? (
          <div
            className="pointer-events-none absolute right-3 z-[110] flex flex-col gap-2"
            style={{ top: "calc(env(safe-area-inset-top) + 0.5rem)" }}
          >
            <button
              data-visual-test-hidden="true"
              type="button"
              onClick={() => setPuzzleOverlayEnabled(!showPuzzleOverlay)}
              className="pointer-events-auto rounded-full bg-coffee-950/70 px-3 py-1.5 text-[11px] font-semibold text-cream-50 shadow-md backdrop-blur"
            >
              {showPuzzleOverlay ? "Overlay Off" : "Overlay On"}
            </button>
            <button
              data-visual-test-hidden="true"
              type="button"
              onClick={() => setShowTuningPanel((v) => !v)}
              className="pointer-events-auto rounded-full bg-coffee-950/70 px-3 py-1.5 text-[11px] font-semibold text-cream-50 shadow-md backdrop-blur"
            >
              {showTuningPanel ? "Tune Off" : "Tune On"}
            </button>
          </div>
        ) : null}
      </main>

      {inputLocked && (
        <div
          className="pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-3 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
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

      {canUsePuzzleDevTools && showTuningPanel ? (
        <PuzzleTuningPanel
          layout={tunedLayout}
          selectedKey={selectedLayoutKey}
          overlayEnabled={showPuzzleOverlay}
          overlayOpacity={puzzleOverlayOpacity}
          onSelectedKeyChange={setSelectedLayoutKey}
          onLayoutItemChange={changeLayoutItem}
          onResetLayout={resetTunedLayout}
          onOverlayEnabledChange={setPuzzleOverlayEnabled}
          onOverlayOpacityChange={changePuzzleOverlayOpacity}
        />
      ) : null}
    </div>
  );
}

function PuzzleLayoutSlot({
  item,
  className,
  children,
}: {
  item: PuzzleLayoutItem;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("absolute overflow-visible", className)}
      style={puzzleLayoutItemStyle(item)}
    >
      {children}
    </div>
  );
}
