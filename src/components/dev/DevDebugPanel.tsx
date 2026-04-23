"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BeanIcon } from "@/components/ui/BeanIcon";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { EspressoShotIcon } from "@/components/ui/EspressoShotIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import {
  getRewardedAdMockBehavior,
  getRewardedAdProviderModeOverride,
  getRewardedAdRuntimeDebugInfo,
  setRewardedAdMockBehavior,
  setRewardedAdProviderModeOverride,
} from "@/lib/ads/rewardedAds";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { useCustomerStore } from "@/stores/useCustomerStore";

function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function isDebugSaveBundle(
  value: unknown,
): value is { app?: unknown; customers?: unknown } {
  if (!value || typeof value !== "object") return false;
  return "app" in value || "customers" in value;
}

export function DevDebugPanel({ className }: { className?: string }) {
  const { lightTap } = useGameFeedback();

  const coins = useAppStore((s) => s.playerResources.coins);
  const beans = useAppStore((s) => s.playerResources.beans);
  const hearts = useAppStore((s) => s.playerResources.hearts);
  const cafe = useAppStore((s) => s.cafeState);

  const patchRes = useAppStore((s) => s.patchPlayerResources);
  const patchCafe = useAppStore((s) => s.patchCafeState);
  const exportSave = useAppStore((s) => s.exportSave);
  const importSave = useAppStore((s) => s.importSave);
  const resetSave = useAppStore((s) => s.resetSave);
  const exportCustomerSave = useCustomerStore((s) => s.exportCustomerSave);
  const importCustomerSave = useCustomerStore((s) => s.importCustomerSave);
  const resetCustomerSave = useCustomerStore((s) => s.resetCustomerSave);

  const [open, setOpen] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [adMockBehavior, setAdMockBehavior] = useState(() =>
    getRewardedAdMockBehavior(),
  );
  const [adProviderOverride, setAdProviderOverride] = useState(() =>
    getRewardedAdProviderModeOverride(),
  );

  const title = useMemo(() => "DEV", []);

  const bump = useCallback(
    (delta: Partial<{ coins: number; beans: number; hearts: number }>) => {
      lightTap();
      patchRes({
        coins: delta.coins != null ? Math.max(0, coins + delta.coins) : coins,
        beans: delta.beans != null ? Math.max(0, beans + delta.beans) : beans,
        hearts:
          delta.hearts != null ? Math.max(0, hearts + delta.hearts) : hearts,
      });
    },
    [beans, coins, hearts, lightTap, patchRes],
  );

  const copySave = useCallback(async () => {
    lightTap();
    try {
      const txt = safeJsonStringify({
        format: "coffee2048-debug-save-bundle",
        app: exportSave(),
        customers: exportCustomerSave(),
      });
      setJsonText(txt);
      await navigator.clipboard.writeText(txt);
      setStatus("앱 + 손님 세이브 JSON을 클립보드에 복사했어요.");
    } catch {
      setStatus("복사 실패: 브라우저 권한을 확인해주세요.");
    }
  }, [exportCustomerSave, exportSave, lightTap]);

  const pasteAndImport = useCallback(async () => {
    lightTap();
    try {
      const txt =
        jsonText.trim().length > 0
          ? jsonText
          : await navigator.clipboard.readText();
      const parsed = JSON.parse(txt);
      const ok = isDebugSaveBundle(parsed)
        ? (("app" in parsed ? importSave(parsed.app) : true) &&
            ("customers" in parsed ? importCustomerSave(parsed.customers) : true))
        : importSave(parsed);
      setStatus(ok ? "세이브를 불러왔어요." : "세이브 형식이 올바르지 않아요.");
    } catch {
      setStatus("불러오기 실패: JSON 형식을 확인해주세요.");
    }
  }, [importCustomerSave, importSave, jsonText, lightTap]);

  const doReset = useCallback(() => {
    lightTap();
    resetSave();
    resetCustomerSave();
    setStatus("앱 + 손님 세이브를 초기화했어요. (설정은 유지)");
  }, [lightTap, resetCustomerSave, resetSave]);

  const giveShots = useCallback(
    (delta: number) => {
      lightTap();
      patchCafe({ espressoShots: Math.max(0, cafe.espressoShots + delta) });
    },
    [cafe.espressoShots, lightTap, patchCafe],
  );

  const clearStatus = useCallback(() => setStatus(null), []);

  return (
    <div
      className={cn(
        // 루트는 클릭 통과: 고정 레이어가 투명 영역까지 포인터를 잡아 로비 버튼이 먹통이 되는 경우 방지
        "pointer-events-none fixed bottom-3 left-3 z-40",
        className,
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            lightTap();
            setOpen((v) => !v);
            clearStatus();
          }}
          className="rounded-full bg-coffee-900/85 px-3 py-2 text-xs font-bold tracking-wide text-cream-50 shadow-md ring-1 ring-black/10 backdrop-blur"
        >
          {title}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="pointer-events-auto mt-2 w-full max-w-[420px] min-w-0"
        >
          <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
                  개발자 디버그
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-coffee-900">
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <CoinIcon size={16} className="opacity-95" />
                    {coins}
                    <span className="sr-only">코인</span>
                  </span>
                  <span className="text-coffee-600/55">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <BeanIcon size={16} className="opacity-95" />
                    {beans}
                    <span className="sr-only">원두</span>
                  </span>
                  <span className="text-coffee-600/55">·</span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <HeartIcon size={16} className="opacity-95" />
                    {hearts}
                    <span className="sr-only">하트</span>
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-[40px] px-3 text-sm"
                onClick={() => {
                  lightTap();
                  setOpen(false);
                }}
              >
                닫기
              </Button>
            </div>

            {status && (
              <div className="rounded-2xl bg-cream-200/70 px-3 py-2 text-xs text-coffee-800 ring-1 ring-coffee-600/10">
                {status}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="soft" onClick={() => bump({ coins: 50 })}>
                <span className="inline-flex items-center justify-center gap-1">
                  <CoinIcon size={16} className="opacity-95" />
                  +50
                  <span className="sr-only">코인</span>
                </span>
              </Button>
              <Button type="button" variant="soft" onClick={() => bump({ beans: 10 })}>
                <span className="inline-flex items-center justify-center gap-1">
                  <BeanIcon size={16} className="opacity-95" />
                  +10
                  <span className="sr-only">원두</span>
                </span>
              </Button>
              <Button type="button" variant="soft" onClick={() => bump({ hearts: 1 })}>
                <span className="inline-flex items-center justify-center gap-1">
                  <HeartIcon size={16} className="opacity-95" />
                  +1
                  <span className="sr-only">하트</span>
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => bump({ coins: -50 })}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <CoinIcon size={16} className="opacity-95" />
                  -50
                  <span className="sr-only">코인</span>
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => bump({ beans: -5 })}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <BeanIcon size={16} className="opacity-95" />
                  -5
                  <span className="sr-only">원두</span>
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => bump({ hearts: -1 })}
              >
                <span className="inline-flex items-center justify-center gap-1">
                  <HeartIcon size={16} className="opacity-95" />
                  -1
                  <span className="sr-only">하트</span>
                </span>
              </Button>
            </div>

            <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
              <div className="text-xs font-semibold text-coffee-700">
                카페 (빠른 조작)
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-coffee-700">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <EspressoShotIcon size={16} className="opacity-95" />
                  <span className="sr-only">샷</span>
                </span>
                <span className="tabular-nums">{cafe.espressoShots}</span>
                <Button
                  type="button"
                  variant="soft"
                  className="min-h-[36px] px-3 text-xs"
                  onClick={() => giveShots(6)}
                >
                  +6
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-[36px] px-3 text-xs"
                  onClick={() => giveShots(-6)}
                >
                  -6
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
              <div className="text-xs font-semibold text-coffee-700">
                보상형 광고 provider
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-coffee-600/80">
                현재 override:{" "}
                <span className="font-semibold">{adProviderOverride ?? "없음(auto)"}</span>
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-coffee-600/80">
                현재 resolved:{" "}
                <span className="font-semibold">
                  {getRewardedAdRuntimeDebugInfo().resolvedProviderMode}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["mock", "web-gpt-rewarded", "unsupported"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={adProviderOverride === mode ? "soft" : "ghost"}
                    className="min-h-[36px] px-3 text-xs"
                    onClick={() => {
                      lightTap();
                      setRewardedAdProviderModeOverride(mode);
                      setAdProviderOverride(mode);
                      setStatus(`보상형 광고 provider override를 '${mode}'로 바꿨어요.`);
                    }}
                  >
                    {mode}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={adProviderOverride === null ? "soft" : "ghost"}
                  className="min-h-[36px] px-3 text-xs"
                  onClick={() => {
                    lightTap();
                    setRewardedAdProviderModeOverride(null);
                    setAdProviderOverride(null);
                    setStatus("보상형 광고 provider override를 지웠어요. (auto)");
                  }}
                >
                  auto
                </Button>
              </div>
            </div>

            <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
              <div className="text-xs font-semibold text-coffee-700">
                보상형 광고 mock
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-coffee-600/80">
                현재 mock 결과: <span className="font-semibold">{adMockBehavior}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["success", "cancel", "error", "no_fill", "unsupported"] as const).map((behavior) => (
                  <Button
                    key={behavior}
                    type="button"
                    variant={adMockBehavior === behavior ? "soft" : "ghost"}
                    className="min-h-[36px] px-3 text-xs"
                    onClick={() => {
                      lightTap();
                      setRewardedAdMockBehavior(behavior);
                      setAdMockBehavior(behavior);
                      setStatus(`보상형 광고 mock 결과를 '${behavior}'로 바꿨어요.`);
                    }}
                  >
                    {behavior}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="soft" onClick={copySave}>
                  세이브 복사
                </Button>
                <Button type="button" variant="soft" onClick={pasteAndImport}>
                  세이브 불러오기
                </Button>
                <Button type="button" variant="ghost" onClick={doReset}>
                  세이브 초기화
                </Button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="여기에 앱/손님 세이브 JSON을 붙여넣고 '세이브 불러오기'를 누르세요."
                className="min-h-[120px] w-full resize-y rounded-2xl bg-cream-50/90 p-3 text-[11px] leading-relaxed text-coffee-900 ring-1 ring-coffee-600/10 outline-none focus:ring-2 focus:ring-coffee-600/25"
              />
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
