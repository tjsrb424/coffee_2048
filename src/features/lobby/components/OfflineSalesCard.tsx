"use client";

import { useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import {
  getRewardedAdAvailability,
  type RewardedAdResult,
  requestRewardedAd,
} from "@/lib/ads/rewardedAds";
import { cn } from "@/lib/utils";
import { t } from "@/locale/i18n";
import { useAppStore } from "@/stores/useAppStore";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";

function formatOfflineDuration(elapsedMs: number): string {
  const totalMinutes = Math.max(1, Math.floor(elapsedMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${totalMinutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

export function OfflineSalesCard({ className }: { className?: string }) {
  const pendingReward = useAppStore((s) => s.cafeState.pendingOfflineReward);
  const claimOfflineReward = useAppStore((s) => s.claimOfflineReward);
  const { lightTap } = useGameFeedback();
  const [claimMode, setClaimMode] = useState<"idle" | "base" | "ad">("idle");
  const [notice, setNotice] = useState<string | null>(null);
  if (!pendingReward || pendingReward.pendingCoins <= 0) return null;

  const adAvailability = getRewardedAdAvailability("offline_reward_double");
  const adSupported = adAvailability.isSupported;
  const isBusy = claimMode !== "idle";

  const handleClaim = (doubled: boolean) => {
    const claimed = claimOfflineReward({
      claimId: pendingReward.claimId,
      doubled,
    });
    if (!claimed) {
      setNotice(t("offlineSales.claimed"));
      setClaimMode("idle");
      return;
    }
    useLobbyFxStore.getState().pingPurchase("offline");
    useLobbyFxStore.getState().pingCafeSell({
      gainedCoins: claimed.pendingCoins,
      soldCount: claimed.soldCount,
      kind: "offline",
    });
  };

  const noticeForResult = (result: RewardedAdResult): string => {
    switch (result.status) {
      case "cancelled":
        return t("offlineSales.adCancelled");
      case "timeout":
        return t("offlineSales.adTimeout");
      case "no_fill":
        return t("offlineSales.adNoFill");
      case "unsupported":
        return t("offlineSales.adUnsupported");
      case "error":
      default:
        return t("offlineSales.adUnavailable");
    }
  };

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            {t("offlineSales.heading")}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-coffee-800">
            {t("offlineSales.body", {
              time: formatOfflineDuration(pendingReward.elapsedMs),
              sold: pendingReward.soldCount,
              coins: pendingReward.pendingCoins,
            })}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-coffee-600/75">
            {t("offlineSales.note")}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-cream-200/65 px-3 py-2 text-right ring-1 ring-coffee-600/8">
          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-coffee-600/70">
            <CoinIcon size={14} className="opacity-90" />
            {t("offlineSales.ready")}
          </div>
          <div className="mt-1 text-lg font-bold tabular-nums text-coffee-900">
            +{pendingReward.pendingCoins}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="soft"
            className="h-11 text-xs font-semibold"
            disabled={isBusy}
            onClick={() => {
              lightTap();
              setNotice(null);
              setClaimMode("base");
              handleClaim(false);
            }}
          >
            {claimMode === "base" ? t("offlineSales.claiming") : t("offlineSales.claim")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 text-xs font-semibold"
            disabled={isBusy || !adSupported}
            onClick={async () => {
              lightTap();
              if (!adSupported) {
                setClaimMode("idle");
                setNotice(t("offlineSales.adUnsupported"));
                return;
              }
              setNotice(null);
              setClaimMode("ad");
              const result = await requestRewardedAd("offline_reward_double");
              if (result.status !== "rewarded") {
                setClaimMode("idle");
                setNotice(noticeForResult(result));
                return;
              }
              handleClaim(true);
            }}
          >
            {claimMode === "ad"
              ? t("offlineSales.adClaiming")
              : adSupported
                ? t("offlineSales.claimDouble")
                : t("offlineSales.claimDoubleUnsupported")}
          </Button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-coffee-600/75">
          {adSupported
            ? t("offlineSales.doubleNote")
            : t("offlineSales.doubleNoteUnsupported")}
        </p>
        {notice ? (
          <p className="mt-2 text-[11px] leading-relaxed text-coffee-700">
            {notice}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
