"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getLastRewardedAdAttempt,
  getRewardedAdRuntimeDebugInfo,
  subscribeRewardedAdAttemptResults,
} from "@/lib/ads/rewardedAds";
import { cn } from "@/lib/utils";

function formatMaybeBoolean(value: boolean | null | undefined) {
  if (value == null) return "unknown";
  return value ? "yes" : "no";
}

function formatMaybeText(value: string | number | null | undefined) {
  if (value == null || value === "") return "(none)";
  return String(value);
}

function formatFocusState(value: boolean | undefined) {
  if (value == null) return "unknown";
  return value ? "focus" : "blur";
}

export function ReadOnlyAdDebugPanel({ className }: { className?: string }) {
  const [open, setOpen] = useState(true);
  const [runtimeDebugInfo, setRuntimeDebugInfo] = useState(() =>
    getRewardedAdRuntimeDebugInfo(),
  );
  const [lastRewardedAdAttempt, setLastRewardedAdAttempt] = useState(() =>
    getLastRewardedAdAttempt(),
  );

  useEffect(() => {
    const sync = () => {
      setRuntimeDebugInfo(getRewardedAdRuntimeDebugInfo());
      setLastRewardedAdAttempt(getLastRewardedAdAttempt());
    };

    sync();
    const unsubscribe = subscribeRewardedAdAttemptResults(() => {
      sync();
    });
    const intervalId = window.setInterval(sync, 1000);
    const handleVisibilityChange = () => sync();
    const handleFocus = () => sync();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const pageDiagnostics = runtimeDebugInfo.pageDiagnostics;
  const gptDiagnostics = runtimeDebugInfo.gptDiagnostics;
  const lastDebug = lastRewardedAdAttempt?.debug;
  const lastLoadDiagnostics = lastDebug?.gptAfterLoad ?? lastDebug?.gptBeforeLoad ?? null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-3 right-3 z-[90]",
        className,
      )}
    >
      <div className="pointer-events-auto flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full bg-coffee-900/90 px-3 py-2 text-xs font-bold tracking-wide text-cream-50 shadow-md ring-1 ring-black/10 backdrop-blur"
        >
          AD DEBUG
        </button>
      </div>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="pointer-events-auto mt-2"
          style={{ width: "min(92vw, 28rem)" }}
        >
          <Card
            className="overflow-y-auto overscroll-contain p-4"
            style={{ maxHeight: "min(78vh, 40rem)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
                  광고 진단
                </div>
                <div className="mt-1 text-sm font-bold text-coffee-900">
                  배포용 읽기 전용 패널
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-coffee-600/80">
                  이 패널은 rewarded 진단값만 보여주며, 재화/세이브/mock/provider
                  변경 기능은 포함하지 않습니다.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="min-h-[40px] px-3 text-sm"
                onClick={() => setOpen(false)}
              >
                닫기
              </Button>
            </div>

            <div className="mt-3 space-y-3 text-[11px] leading-relaxed text-coffee-800">
              <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-700">
                  현재 provider 상태
                </div>
                <div className="mt-2 space-y-1">
                  <div>
                    configured / override / resolved:{" "}
                    <span className="font-semibold">
                      {runtimeDebugInfo.configuredProviderMode}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {runtimeDebugInfo.providerModeOverride ?? "(none)"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {runtimeDebugInfo.resolvedProviderMode}
                    </span>
                  </div>
                  <div>
                    path / href:{" "}
                    <span className="font-semibold">
                      {pageDiagnostics?.path ?? "(unknown)"}
                    </span>
                    {" / "}
                    <span className="break-all font-mono">
                      {pageDiagnostics?.href ?? "(unknown)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-700">
                  현재 페이지 상태
                </div>
                <div className="mt-2 space-y-1">
                  <div>
                    secure / mobile / touch:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(pageDiagnostics?.isSecureContext)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(pageDiagnostics?.isLikelyMobileDevice)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(pageDiagnostics?.hasTouchSupport)}
                    </span>
                  </div>
                  <div>
                    top-level / focus / ready:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(pageDiagnostics?.isTopLevelWindow)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatFocusState(pageDiagnostics?.hasFocus)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {pageDiagnostics?.documentReadyState ?? "unknown"}
                    </span>
                  </div>
                  <div>
                    viewport meta:{" "}
                    <span className="break-all font-mono">
                      {pageDiagnostics?.viewportMetaContent ?? "(missing)"}
                    </span>
                  </div>
                  <div>
                    unsupported 후보:{" "}
                    <span className="font-semibold">
                      {pageDiagnostics?.likelyUnsupportedReasons?.length
                        ? pageDiagnostics.likelyUnsupportedReasons.join(", ")
                        : "뚜렷한 페이지 레벨 문제 없음"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-700">
                  현재 GPT 상태
                </div>
                <div className="mt-2 space-y-1">
                  <div>
                    googletag / apiReady / pubadsReady:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.hasWindowGoogletag)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.apiReady)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.pubadsReady)}
                    </span>
                  </div>
                  <div>
                    rewarded enum / script count:{" "}
                    <span className="font-semibold">
                      {gptDiagnostics?.rewardedEnumAvailable
                        ? gptDiagnostics.rewardedEnumValue
                        : "missing"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeText(gptDiagnostics?.matchingScriptTagCount)}
                    </span>
                  </div>
                  <div>
                    cmd length / services error:{" "}
                    <span className="font-semibold">
                      {formatMaybeText(gptDiagnostics?.cmdLength)}
                    </span>
                    {" / "}
                    <span className="font-mono">
                      {gptDiagnostics?.servicesEnableError ?? "(none)"}
                    </span>
                  </div>
                  <div>
                    slot API / display / servicesEnabledByApp:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.hasDefineOutOfPageSlot)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.hasDisplay)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.servicesEnabledByApp)}
                    </span>
                  </div>
                  <div>
                    scriptLoaded / bootstrapStarted / bootstrapCompleted:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.scriptLoaded)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.bootstrapStarted)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.bootstrapCompleted)}
                    </span>
                  </div>
                  <div>
                    services attempted / enabled / error:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.servicesEnableAttempted)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.servicesEnabledByApp)}
                    </span>
                    {" / "}
                    <span className="font-mono">
                      {gptDiagnostics?.servicesEnableError ?? "(none)"}
                    </span>
                  </div>
                  <div>
                    script append / target / reuse:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.scriptAppendAttempted)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {gptDiagnostics?.scriptAppendTarget ?? "none"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.existingScriptReused)}
                    </span>
                  </div>
                  <div>
                    script src / found after append:{" "}
                    <span className="break-all font-mono">
                      {gptDiagnostics?.scriptElementSrc ?? gptDiagnostics?.scriptUrl ?? "(missing)"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.scriptTagFoundAfterAppend)}
                    </span>
                  </div>
                  <div>
                    script onload / onerror / timeout ms:{" "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.scriptOnloadFired)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.scriptOnerrorFired)}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeText(gptDiagnostics?.scriptTimeoutMs)}
                    </span>
                  </div>
                  <div>
                    script outcome / CSP suspected:{" "}
                    <span className="font-semibold">
                      {gptDiagnostics?.scriptLoadOutcome ?? "unknown"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeBoolean(gptDiagnostics?.cspSuspected)}
                    </span>
                  </div>
                  <div>
                    bootstrap outcome / timeout ms:{" "}
                    <span className="font-semibold">
                      {gptDiagnostics?.bootstrapClassification ?? "unknown"}
                    </span>
                    {" / "}
                    <span className="font-semibold">
                      {formatMaybeText(gptDiagnostics?.bootstrapTimeoutMs)}
                    </span>
                  </div>
                  {gptDiagnostics?.scriptLoadClassification ? (
                    <div>
                      script classification:{" "}
                      <span className="font-mono">
                        {gptDiagnostics.scriptLoadClassification}
                      </span>
                    </div>
                  ) : null}
                  {gptDiagnostics?.cspViolationDirective ||
                  gptDiagnostics?.cspViolationBlockedUri ? (
                    <div>
                      CSP hint:{" "}
                      <span className="font-mono">
                        {gptDiagnostics?.cspViolationDirective ?? "script-src"} /{" "}
                        {gptDiagnostics?.cspViolationBlockedUri ?? "(blocked uri unknown)"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl bg-coffee-900/5 px-3 py-3 ring-1 ring-coffee-600/10">
                <div className="text-xs font-semibold text-coffee-700">
                  마지막 광고 시도
                </div>
                {lastRewardedAdAttempt ? (
                  <div className="mt-2 space-y-1">
                    <div>
                      placement:{" "}
                      <span className="font-semibold">
                        {lastRewardedAdAttempt.placement}
                      </span>
                    </div>
                    <div>
                      provider:status:{" "}
                      <span className="font-semibold">
                        {lastRewardedAdAttempt.provider}:{lastRewardedAdAttempt.status}
                      </span>
                    </div>
                    <div>
                      details:{" "}
                      <span className="break-all font-mono">
                        {lastRewardedAdAttempt.details ?? "(none)"}
                      </span>
                    </div>
                    <div>
                      slotReturnedNull:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.slotReturnedNull)}
                      </span>
                    </div>
                    <div>
                      failure stage / slotAttempted:{" "}
                      <span className="font-semibold">
                        {lastDebug?.failureStage ?? "(none)"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.slotAttempted)}
                      </span>
                    </div>
                    <div>
                      request path / slot path:{" "}
                      <span className="font-semibold">
                        {lastDebug?.requestedPath ?? "(unknown)"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {lastDebug?.pageAtSlotAttempt?.path ?? "(none)"}
                      </span>
                    </div>
                    <div>
                      request secure/mobile/touch:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtRequest?.isSecureContext)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtRequest?.isLikelyMobileDevice)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtRequest?.hasTouchSupport)}
                      </span>
                    </div>
                    <div>
                      slot secure/mobile/touch:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtSlotAttempt?.isSecureContext)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtSlotAttempt?.isLikelyMobileDevice)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtSlotAttempt?.hasTouchSupport)}
                      </span>
                    </div>
                    <div>
                      request top-level / slot top-level:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtRequest?.isTopLevelWindow)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.pageAtSlotAttempt?.isTopLevelWindow)}
                      </span>
                    </div>
                    <div>
                      request viewport / slot viewport:{" "}
                      <span className="break-all font-mono">
                        {lastDebug?.pageAtRequest?.viewportMetaContent ?? "(missing)"}
                      </span>
                      {" / "}
                      <span className="break-all font-mono">
                        {lastDebug?.pageAtSlotAttempt?.viewportMetaContent ?? "(missing)"}
                      </span>
                    </div>
                    <div>
                      request GPT apiReady / slot GPT apiReady:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.gptAfterLoad?.apiReady)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastDebug?.gptAtSlotAttempt?.apiReady)}
                      </span>
                    </div>
                    <div>
                      slot rewarded enum / script count:{" "}
                      <span className="font-semibold">
                        {lastDebug?.gptAtSlotAttempt?.rewardedEnumValue ?? "(missing)"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeText(
                          lastDebug?.gptAtSlotAttempt?.matchingScriptTagCount,
                        )}
                      </span>
                    </div>
                    <div>
                      load append / target / reuse:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.scriptAppendAttempted)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {lastLoadDiagnostics?.scriptAppendTarget ?? "none"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.existingScriptReused)}
                      </span>
                    </div>
                    <div>
                      load scriptLoaded / bootstrapStarted / bootstrapCompleted:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.scriptLoaded)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.bootstrapStarted)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.bootstrapCompleted)}
                      </span>
                    </div>
                    <div>
                      load services attempted / enabled:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.servicesEnableAttempted)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.servicesEnabledByApp)}
                      </span>
                    </div>
                  <div>
                    load cmd length / services error:{" "}
                    <span className="font-semibold">
                      {formatMaybeText(lastLoadDiagnostics?.cmdLength)}
                    </span>
                    {" / "}
                    <span className="font-mono">
                      {lastLoadDiagnostics?.servicesEnableError ?? "(none)"}
                    </span>
                  </div>
                    <div>
                      load src / found after append:{" "}
                      <span className="break-all font-mono">
                        {lastLoadDiagnostics?.scriptElementSrc ??
                          lastLoadDiagnostics?.scriptUrl ??
                          "(missing)"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.scriptTagFoundAfterAppend)}
                      </span>
                    </div>
                    <div>
                      load onload / onerror / timeout ms:{" "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.scriptOnloadFired)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.scriptOnerrorFired)}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeText(lastLoadDiagnostics?.scriptTimeoutMs)}
                      </span>
                    </div>
                    <div>
                      load outcome / CSP suspected:{" "}
                      <span className="font-semibold">
                        {lastLoadDiagnostics?.scriptLoadOutcome ?? "unknown"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeBoolean(lastLoadDiagnostics?.cspSuspected)}
                      </span>
                    </div>
                    <div>
                      load bootstrap outcome / timeout ms:{" "}
                      <span className="font-semibold">
                        {lastLoadDiagnostics?.bootstrapClassification ?? "unknown"}
                      </span>
                      {" / "}
                      <span className="font-semibold">
                        {formatMaybeText(lastLoadDiagnostics?.bootstrapTimeoutMs)}
                      </span>
                    </div>
                    {lastLoadDiagnostics?.scriptLoadClassification ? (
                      <div>
                        load classification:{" "}
                        <span className="font-mono">
                          {lastLoadDiagnostics.scriptLoadClassification}
                        </span>
                      </div>
                    ) : null}
                    {lastLoadDiagnostics?.cspViolationDirective ||
                    lastLoadDiagnostics?.cspViolationBlockedUri ? (
                      <div>
                        load CSP hint:{" "}
                        <span className="font-mono">
                          {lastLoadDiagnostics?.cspViolationDirective ?? "script-src"} /{" "}
                          {lastLoadDiagnostics?.cspViolationBlockedUri ??
                            "(blocked uri unknown)"}
                        </span>
                      </div>
                    ) : null}
                    {lastDebug?.notes?.length ? (
                      <div>
                        debug notes:{" "}
                        <span className="break-all font-mono">
                          {lastDebug.notes.join(", ")}
                        </span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-2 text-coffee-600/80">
                    아직 기록된 광고 시도가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}
