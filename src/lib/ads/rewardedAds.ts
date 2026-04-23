"use client";

import type {
  RewardedAdMockBehavior,
  RewardedAdPlacement,
} from "@/features/meta/types/gameState";

export type RewardedAdProviderMode =
  | "auto"
  | "mock"
  | "web-gpt-rewarded"
  | "unsupported";

export type RewardedAdProvider = "mock" | "web-gpt-rewarded" | "unsupported";

export type RewardedAdStatus =
  | "rewarded"
  | "cancelled"
  | "error"
  | "no_fill"
  | "unsupported";

export type RewardedAdResult = {
  placement: RewardedAdPlacement;
  provider: RewardedAdProvider;
  status: RewardedAdStatus;
  details?: string;
};

export interface RewardedAdAdapter {
  requestRewardedAd(placement: RewardedAdPlacement): Promise<RewardedAdResult>;
}

type RewardedAdRuntimeConfig = {
  configuredProviderMode: RewardedAdProviderMode;
  providerModeOverride: RewardedAdProviderMode | null;
  resolvedProviderMode: RewardedAdProviderMode;
  gptScriptUrl: string;
  requestTimeoutMs: number;
  adUnitPaths: Record<RewardedAdPlacement, string | null>;
};

type GoogletagSlot = {
  addService(service: GoogletagPubAdsService): GoogletagSlot;
  getSlotElementId(): string;
  setTargeting?(key: string, value: string): GoogletagSlot;
};

type GoogletagRewardedReadyEvent = {
  slot: GoogletagSlot;
  makeRewardedVisible(): boolean;
};

type GoogletagRewardedGrantedEvent = {
  slot: GoogletagSlot;
  payload?: {
    type?: string;
    amount?: number;
  };
};

type GoogletagRewardedClosedEvent = {
  slot: GoogletagSlot;
};

type GoogletagSlotRenderEndedEvent = {
  slot: GoogletagSlot;
  isEmpty: boolean;
};

type GoogletagPubAdsService = {
  addEventListener(
    eventType:
      | "rewardedSlotReady"
      | "rewardedSlotGranted"
      | "rewardedSlotClosed"
      | "slotRenderEnded",
    listener: (
      event:
        | GoogletagRewardedReadyEvent
        | GoogletagRewardedGrantedEvent
        | GoogletagRewardedClosedEvent
        | GoogletagSlotRenderEndedEvent,
    ) => void,
  ): void;
  removeEventListener(
    eventType:
      | "rewardedSlotReady"
      | "rewardedSlotGranted"
      | "rewardedSlotClosed"
      | "slotRenderEnded",
    listener: (
      event:
        | GoogletagRewardedReadyEvent
        | GoogletagRewardedGrantedEvent
        | GoogletagRewardedClosedEvent
        | GoogletagSlotRenderEndedEvent,
    ) => void,
  ): void;
};

type GoogletagApi = {
  apiReady?: boolean;
  cmd: Array<() => void>;
  enums: {
    OutOfPageFormat: {
      REWARDED: string;
    };
  };
  pubads(): GoogletagPubAdsService;
  enableServices(): void;
  defineOutOfPageSlot(
    adUnitPath: string,
    format: string,
  ): GoogletagSlot | null;
  display(slot: GoogletagSlot | string): void;
  destroySlots?(slots?: GoogletagSlot[]): boolean;
};

export const REWARDED_AD_MOCK_OUTCOME_STORAGE_KEY =
  "coffee2048_mock_rewarded_ad_outcome" as const;
export const REWARDED_AD_MOCK_DELAY_STORAGE_KEY =
  "coffee2048_mock_rewarded_ad_delay_ms" as const;
export const REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY =
  "coffee2048_rewarded_ad_provider_override" as const;
export const REWARDED_AD_GPT_OFFLINE_AD_UNIT_PATH_OVERRIDE_STORAGE_KEY =
  "coffee2048_rewarded_gpt_offline_ad_unit_path" as const;
export const REWARDED_AD_GPT_PUZZLE_AD_UNIT_PATH_OVERRIDE_STORAGE_KEY =
  "coffee2048_rewarded_gpt_puzzle_ad_unit_path" as const;

const DEFAULT_GPT_SCRIPT_URL =
  "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;

let gptLoadPromise: Promise<GoogletagApi> | null = null;
let gptServicesEnabled = false;

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readMockOutcome(): RewardedAdMockBehavior {
  if (typeof window === "undefined") return "success";
  const raw = window.localStorage.getItem(REWARDED_AD_MOCK_OUTCOME_STORAGE_KEY);
  return raw === "cancel" ||
    raw === "error" ||
    raw === "no_fill" ||
    raw === "unsupported"
    ? raw
    : "success";
}

function readMockDelayMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = Number(window.localStorage.getItem(REWARDED_AD_MOCK_DELAY_STORAGE_KEY) ?? "300");
  if (!Number.isFinite(raw)) return 300;
  return Math.max(0, Math.floor(raw));
}

function readProviderModeOverride(): RewardedAdProviderMode | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY);
  return raw === "auto" ||
    raw === "mock" ||
    raw === "web-gpt-rewarded" ||
    raw === "unsupported"
    ? raw
    : null;
}

function readAdUnitPathOverride(
  placement: RewardedAdPlacement,
): string | null {
  if (typeof window === "undefined") return null;
  const storageKey =
    placement === "offline_reward_double"
      ? REWARDED_AD_GPT_OFFLINE_AD_UNIT_PATH_OVERRIDE_STORAGE_KEY
      : REWARDED_AD_GPT_PUZZLE_AD_UNIT_PATH_OVERRIDE_STORAGE_KEY;
  const raw = window.localStorage.getItem(storageKey)?.trim();
  return raw ? raw : null;
}

function readProviderModeFromEnv(): RewardedAdProviderMode {
  const raw = process.env.NEXT_PUBLIC_REWARDED_AD_PROVIDER?.trim();
  return raw === "mock" || raw === "web-gpt-rewarded" || raw === "unsupported"
    ? raw
    : "auto";
}

function readRequestTimeoutMs(): number {
  const raw = Number(
    process.env.NEXT_PUBLIC_REWARDED_AD_REQUEST_TIMEOUT_MS ??
      `${DEFAULT_REQUEST_TIMEOUT_MS}`,
  );
  if (!Number.isFinite(raw)) return DEFAULT_REQUEST_TIMEOUT_MS;
  return Math.max(2_000, Math.floor(raw));
}

function readRuntimeConfig(): RewardedAdRuntimeConfig {
  const configuredProviderMode = readProviderModeFromEnv();
  const providerModeOverride = readProviderModeOverride();
  const adUnitPaths: Record<RewardedAdPlacement, string | null> = {
    offline_reward_double:
      readAdUnitPathOverride("offline_reward_double") ??
      process.env.NEXT_PUBLIC_GAM_REWARDED_OFFLINE_AD_UNIT_PATH?.trim() ??
      null,
    puzzle_result_double:
      readAdUnitPathOverride("puzzle_result_double") ??
      process.env.NEXT_PUBLIC_GAM_REWARDED_PUZZLE_AD_UNIT_PATH?.trim() ??
      null,
  };
  const requestedMode = providerModeOverride ?? configuredProviderMode;
  const hasAtLeastOneAdUnit = Object.values(adUnitPaths).some(Boolean);
  const resolvedProviderMode =
    requestedMode !== "auto"
      ? requestedMode
      : process.env.NODE_ENV !== "production"
        ? "mock"
        : hasAtLeastOneAdUnit
          ? "web-gpt-rewarded"
          : "unsupported";

  return {
    configuredProviderMode,
    providerModeOverride,
    resolvedProviderMode,
    gptScriptUrl:
      process.env.NEXT_PUBLIC_GAM_REWARDED_SCRIPT_URL?.trim() ||
      DEFAULT_GPT_SCRIPT_URL,
    requestTimeoutMs: readRequestTimeoutMs(),
    adUnitPaths,
  };
}

function getWindowGoogletag():
  | (Partial<GoogletagApi> & { cmd?: Array<() => void> })
  | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as typeof window & { googletag?: Partial<GoogletagApi> & { cmd?: Array<() => void> } })
    .googletag;
}

function isGoogletagReady(
  value: Partial<GoogletagApi> | undefined,
): value is GoogletagApi {
  return !!value &&
    Array.isArray(value.cmd) &&
    typeof value.pubads === "function" &&
    typeof value.defineOutOfPageSlot === "function" &&
    typeof value.enableServices === "function" &&
    typeof value.display === "function" &&
    !!value.enums?.OutOfPageFormat?.REWARDED;
}

function ensureWindowGoogletagShell() {
  if (typeof window === "undefined") return;
  const current = getWindowGoogletag();
  if (current?.cmd) return;
  (window as typeof window & { googletag?: { cmd: Array<() => void> } }).googletag = {
    cmd: current?.cmd ?? [],
  };
}

async function ensureGoogletagLoaded(
  scriptUrl: string,
  timeoutMs: number,
): Promise<GoogletagApi> {
  const current = getWindowGoogletag();
  if (isGoogletagReady(current)) return current;
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("rewarded ads require a browser environment");
  }
  if (gptLoadPromise) return gptLoadPromise;

  ensureWindowGoogletagShell();

  gptLoadPromise = new Promise<GoogletagApi>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      cleanup();
      gptLoadPromise = null;
      reject(new Error("GPT load timed out"));
    }, timeoutMs);

    const existingScript = document.querySelector(
      `script[src="${scriptUrl}"]`,
    ) as HTMLScriptElement | null;

    const finish = () => {
      if (settled) return;
      const next = getWindowGoogletag();
      if (!isGoogletagReady(next)) return;
      settled = true;
      cleanup();
      resolve(next);
    };

    const pollId = window.setInterval(finish, 50);

    const onLoad = () => {
      finish();
    };

    const onError = () => {
      cleanup();
      gptLoadPromise = null;
      reject(new Error("GPT script failed to load"));
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(pollId);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const script = existingScript ?? document.createElement("script");
    if (!existingScript) {
      script.async = true;
      script.src = scriptUrl;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    finish();
  });

  return gptLoadPromise;
}

function ensureGoogletagServicesEnabled(googletag: GoogletagApi) {
  if (gptServicesEnabled) return;
  googletag.enableServices();
  gptServicesEnabled = true;
}

class MockRewardedAdAdapter implements RewardedAdAdapter {
  async requestRewardedAd(
    placement: RewardedAdPlacement,
  ): Promise<RewardedAdResult> {
    await sleep(readMockDelayMs());
    const outcome = readMockOutcome();
    if (outcome === "cancel") {
      return { placement, provider: "mock", status: "cancelled" };
    }
    if (outcome === "error") {
      return { placement, provider: "mock", status: "error" };
    }
    if (outcome === "no_fill") {
      return { placement, provider: "mock", status: "no_fill" };
    }
    if (outcome === "unsupported") {
      return { placement, provider: "mock", status: "unsupported" };
    }
    return { placement, provider: "mock", status: "rewarded" };
  }
}

class UnsupportedRewardedAdAdapter implements RewardedAdAdapter {
  async requestRewardedAd(
    placement: RewardedAdPlacement,
  ): Promise<RewardedAdResult> {
    return {
      placement,
      provider: "unsupported",
      status: "unsupported",
      details: "rewarded ads are not configured for this environment",
    };
  }
}

class WebGptRewardedAdAdapter implements RewardedAdAdapter {
  constructor(private readonly config: RewardedAdRuntimeConfig) {}

  async requestRewardedAd(
    placement: RewardedAdPlacement,
  ): Promise<RewardedAdResult> {
    const adUnitPath = this.config.adUnitPaths[placement];
    if (!adUnitPath) {
      return {
        placement,
        provider: "web-gpt-rewarded",
        status: "unsupported",
        details: "missing GAM rewarded ad unit path",
      };
    }

    let googletag: GoogletagApi;
    try {
      googletag = await ensureGoogletagLoaded(
        this.config.gptScriptUrl,
        this.config.requestTimeoutMs,
      );
    } catch (error) {
      return {
        placement,
        provider: "web-gpt-rewarded",
        status: "error",
        details:
          error instanceof Error ? error.message : "failed to load GPT runtime",
      };
    }

    return new Promise<RewardedAdResult>((resolve) => {
      const run = () => {
        const pubads = googletag.pubads();
        const slot = googletag.defineOutOfPageSlot(
          adUnitPath,
          googletag.enums.OutOfPageFormat.REWARDED,
        );

        if (!slot) {
          resolve({
            placement,
            provider: "web-gpt-rewarded",
            status: "unsupported",
            details: "rewarded slot is unsupported on this page or device",
          });
          return;
        }

        slot.addService(pubads);
        slot.setTargeting?.("coffee2048_rewarded_placement", placement);

        let settled = false;
        let rewardGranted = false;
        const timeoutId = window.setTimeout(() => {
          finalize({
            placement,
            provider: "web-gpt-rewarded",
            status: "error",
            details: "rewarded slot timed out before completion",
          });
        }, this.config.requestTimeoutMs);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          pubads.removeEventListener("rewardedSlotReady", onReady);
          pubads.removeEventListener("rewardedSlotGranted", onGranted);
          pubads.removeEventListener("rewardedSlotClosed", onClosed);
          pubads.removeEventListener("slotRenderEnded", onRenderEnded);
          googletag.destroySlots?.([slot]);
        };

        const finalize = (result: RewardedAdResult) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(result);
        };

        const isTargetSlot = (
          event:
            | GoogletagRewardedReadyEvent
            | GoogletagRewardedGrantedEvent
            | GoogletagRewardedClosedEvent
            | GoogletagSlotRenderEndedEvent,
        ) => event.slot === slot;

        const onReady = (event: GoogletagRewardedReadyEvent | GoogletagSlotRenderEndedEvent | GoogletagRewardedGrantedEvent | GoogletagRewardedClosedEvent) => {
          if (!("makeRewardedVisible" in event) || !isTargetSlot(event)) return;
          const shown = event.makeRewardedVisible();
          if (!shown) {
            finalize({
              placement,
              provider: "web-gpt-rewarded",
              status: "error",
              details: "rewarded slot failed to become visible",
            });
          }
        };

        const onGranted = (event: GoogletagRewardedReadyEvent | GoogletagSlotRenderEndedEvent | GoogletagRewardedGrantedEvent | GoogletagRewardedClosedEvent) => {
          if (!("payload" in event) || !isTargetSlot(event)) return;
          rewardGranted = true;
        };

        const onClosed = (event: GoogletagRewardedReadyEvent | GoogletagSlotRenderEndedEvent | GoogletagRewardedGrantedEvent | GoogletagRewardedClosedEvent) => {
          if (!isTargetSlot(event) || "isEmpty" in event || "payload" in event || "makeRewardedVisible" in event) {
            return;
          }
          finalize({
            placement,
            provider: "web-gpt-rewarded",
            status: rewardGranted ? "rewarded" : "cancelled",
          });
        };

        const onRenderEnded = (event: GoogletagRewardedReadyEvent | GoogletagSlotRenderEndedEvent | GoogletagRewardedGrantedEvent | GoogletagRewardedClosedEvent) => {
          if (!("isEmpty" in event) || !isTargetSlot(event)) return;
          if (!event.isEmpty) return;
          finalize({
            placement,
            provider: "web-gpt-rewarded",
            status: "no_fill",
            details: "rewarded slot returned no fill",
          });
        };

        pubads.addEventListener("rewardedSlotReady", onReady);
        pubads.addEventListener("rewardedSlotGranted", onGranted);
        pubads.addEventListener("rewardedSlotClosed", onClosed);
        pubads.addEventListener("slotRenderEnded", onRenderEnded);

        ensureGoogletagServicesEnabled(googletag);
        googletag.display(slot);
      };

      if (googletag.apiReady) {
        run();
        return;
      }
      googletag.cmd.push(run);
    });
  }
}

function createRewardedAdAdapter(
  config: RewardedAdRuntimeConfig,
): RewardedAdAdapter {
  switch (config.resolvedProviderMode) {
    case "mock":
      return new MockRewardedAdAdapter();
    case "web-gpt-rewarded":
      return new WebGptRewardedAdAdapter(config);
    case "unsupported":
    case "auto":
    default:
      return new UnsupportedRewardedAdAdapter();
  }
}

export function requestRewardedAd(
  placement: RewardedAdPlacement,
): Promise<RewardedAdResult> {
  const config = readRuntimeConfig();
  return createRewardedAdAdapter(config).requestRewardedAd(placement);
}

export function getRewardedAdMockBehavior(): RewardedAdMockBehavior {
  return readMockOutcome();
}

export function setRewardedAdMockBehavior(
  behavior: RewardedAdMockBehavior,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REWARDED_AD_MOCK_OUTCOME_STORAGE_KEY, behavior);
}

export function getRewardedAdProviderModeOverride():
  | RewardedAdProviderMode
  | null {
  return readProviderModeOverride();
}

export function setRewardedAdProviderModeOverride(
  mode: RewardedAdProviderMode | null,
) {
  if (typeof window === "undefined") return;
  if (!mode) {
    window.localStorage.removeItem(REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(REWARDED_AD_PROVIDER_OVERRIDE_STORAGE_KEY, mode);
}

export function getRewardedAdRuntimeDebugInfo() {
  return readRuntimeConfig();
}
