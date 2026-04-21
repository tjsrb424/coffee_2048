"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SAMPLE_CUSTOMERS } from "@/data/customers";
import { MENU_ORDER } from "@/features/meta/balance/cafeEconomy";
import { beverageIdForRecipeId } from "@/features/meta/content/codex";
import { t } from "@/locale/i18n";
import { useAppStore } from "@/stores/useAppStore";
import type { DrinkMenuId } from "@/features/meta/types/gameState";
import type {
  CustomerId,
  CustomerProfile,
  CustomerRuntimeState,
} from "@/features/customers/types";
import type { MessageId } from "@locale/messages/ko";
import {
  clampStoryIndex,
  nextRuntimeStateOnAffectionGain,
} from "@/features/customers/lib/affection";
import {
  resolvePreferenceHookForSale,
  type CustomerPreferenceHookResult,
} from "@/features/customers/lib/preferenceHooks";
import { affectionGainFromCafeSales } from "@/features/customers/lib/saleAffection";

type CustomerIndex = Record<CustomerId, CustomerProfile>;

const CORE_CUSTOMER_IDS = new Set<CustomerId>([
  "han_eun",
  "hyo_im",
  "seo_jun",
  "so_yeon",
  "dong_hyun",
]);

export const CUSTOMER_STORAGE_KEY = "coffee2048_customers_v1" as const;
export const CUSTOMER_STORAGE_VERSION = 6 as const;

type SaleSessionState = {
  /** 세션 시작 시각(ms) — 큐 생성 시드 */
  startedAtMs: number;
  /** 세션 내 방문 손님 큐 */
  queue: CustomerId[];
  /** 현재 손님이 남은 구매 잔 수(1~2) */
  currentRemainingCups: number;
  /** 이 세션에서 오늘의 손님이 이미 큐에 포함되었는지(최대 1회) */
  featuredQueued: boolean;
};

type CustomerSaveState = {
  /** 고객별 런타임 상태(애정도/단골/스토리 단계). */
  byId: Record<CustomerId, CustomerRuntimeState>;
  /** MVP: 오늘의 대표 손님(판매 루프 최소 연결). */
  featuredCustomerId: CustomerId;
  /** 오늘의 손님이 오늘 몇 번 더 들를 수 있는지(1~2) */
  featuredDailyQuotaTotal: number;
  /** 오늘의 손님 방문 소진 횟수 */
  featuredDailyQuotaUsed: number;
  /** quota를 리셋한 일 키(UTC day) */
  featuredQuotaDayKey: number;
  /**
   * 일 단위 로테이션 앵커(UTC 근사 일 단위).
   * `ensureFeaturedForToday`에서 같은 날짜면 손님을 바꾸지 않음.
   */
  lastFeaturedDayKey: number;
};

/** 카운터 시트용 짧은 판매 피드백(비저장, 수 초만 유지) */
export type CustomerCounterSalePing = {
  atMs: number;
  gainedAffection: number;
  shopAfter: number;
  /** 막 다녀간 손님 이름(2~3명까지, 표시용) */
  buyerNames: string[];
};

/** 스토리 조각 해금 1회성 피드백(비저장) */
export type CustomerStoryUnlockPing = {
  atMs: number;
  /** 해금된 단계 제목(이미 번역된 문자열) */
  title: string;
};

/** 단골 손님이 남긴 작은 흔적(비저장) */
export type RegularGiftPing = {
  atMs: number;
  giverName: string;
  /** 짧은 메모 문구(이미 번역된 문자열) */
  note: string;
  /** 아주 작은 팁(코인) — 문구와 함께 조용히만 노출 */
  tipCoins: number;
};

export type CustomerPreferenceHookPing = {
  atMs: number;
  customerId: CustomerId;
  matchedTags: string[];
  context: CustomerPreferenceHookResult;
};

type CustomerStore = CustomerSaveState & {
  /** 마지막 자동판매로 인한 애정 피드백(카운터 시트 1줄용) */
  lastCounterSalePing: CustomerCounterSalePing | null;
  /** 애정 임계치로 스토리 단계가 올라간 직후 짧은 피드백(카운터 시트) */
  lastStoryUnlockPing: CustomerStoryUnlockPing | null;
  /** 판매 세션(비저장) — 여러 손님이 오가는 최소 배치 */
  saleSession: SaleSessionState | null;
  /** 단골 손님이 남긴 작은 흔적(카운터 시트 1줄용) */
  lastRegularGiftPing: RegularGiftPing | null;
  /** 새 성장/도감/시간대 시스템과 연결되는 최소 선호 훅(비저장) */
  lastPreferenceHookPing: CustomerPreferenceHookPing | null;
  /** 흔적 스팸 방지용 전역 쿨다운(ms) */
  lastRegularGiftAtMs: number;
  /** 가게 애정도(정의: 개별 손님 애정도의 합산) */
  shopAffection: () => number;
  /** 고객 프로필 조회(샘플/추후 확장) */
  profile: (id: CustomerId) => CustomerProfile | null;
  /** 고객 상태 조회 */
  stateOf: (id: CustomerId) => CustomerRuntimeState | null;
  /** 판매 1회(또는 soldCount 묶음) 발생 시 애정도 상승 훅 */
  recordCafeSale: (input: {
    soldCount: number;
    /** 메뉴별 판매 잔 수(자동 판매에서 집계). 있으면 선호 메뉴 보너스 계산에 사용 */
    soldByMenu?: Partial<Record<DrinkMenuId, number>>;
    nowMs?: number;
  }) => {
    gainedAffection: number;
    customerDisplayName: string;
    shopAffectionAfter: number;
    /** 선호 메뉴로 인한 추가 애정(= 맞춤 잔 수) */
    preferredBonus: number;
    /** 이번 판매로 새로 열린 스토리 조각 제목(없으면 null) */
    storyUnlockTitle: string | null;
  } | null;
  /** 판매 세션을 확보(판매 개시 시 호출) */
  ensureSaleSession: (nowMs?: number) => void;
  /** 판매 종료 시 세션을 정리 */
  clearSaleSession: () => void;
  /** 오늘의 손님 방문 quota를 오늘 날짜 기준으로 보정 */
  ensureFeaturedQuotaForToday: (nowMs?: number) => void;
  /** 대표 손님 변경(추후 로테이션/조건 연결 대비) */
  setFeaturedCustomer: (id: CustomerId) => void;
  /** 캘린더 일 기준으로 오늘의 손님 1명을 고름(최소 로테이션). */
  ensureFeaturedForToday: (nowMs?: number) => void;
  /** 개발자 디버그: 손님 저장 데이터만 덤프 */
  exportCustomerSave: () => CustomerSaveState;
  /** 개발자 디버그: 손님 저장 데이터만 로드 */
  importCustomerSave: (data: unknown) => boolean;
  /** 개발자 디버그: 손님 저장 데이터만 초기화 */
  resetCustomerSave: () => void;
};

const PROFILE_INDEX: CustomerIndex = Object.fromEntries(
  SAMPLE_CUSTOMERS.map((c) => [c.id, c]),
);

type CoreGiftProfile = {
  /** 흔적 발생 확률(아주 미세한 차이만) */
  chance: number;
  /** 문구 메시지 id들(손님별 1~2개) */
  noteTextIds: MessageId[];
  /** 소액 팁 코인 범위(0이면 메모만) */
  tipCoinsMin: number;
  tipCoinsMax: number;
};

const CORE_GIFT_PROFILES: Partial<Record<CustomerId, CoreGiftProfile>> = {
  // 한은: 고요하고 절제된 톤 — 메모 중심, 팁은 드물게 아주 작게
  han_eun: {
    chance: 0.045,
    noteTextIds: ["gift.core.han_eun.note1", "gift.core.han_eun.note2"],
    tipCoinsMin: 0,
    tipCoinsMax: 2,
  },
  // 효임: 부드럽고 조용한 감사 — 소액 팁이 조금 더 자주
  hyo_im: {
    chance: 0.055,
    noteTextIds: ["gift.core.hyo_im.note1", "gift.core.hyo_im.note2"],
    tipCoinsMin: 1,
    tipCoinsMax: 3,
  },
  // 서준: 늦은 밤의 짧은 인사 — 메모 위주, 팁은 아주 드물게
  seo_jun: {
    chance: 0.045,
    noteTextIds: ["gift.core.seo_jun.note1", "gift.core.seo_jun.note2"],
    tipCoinsMin: 0,
    tipCoinsMax: 2,
  },
  // 소연: 가벼운 감사/메모 톤 — 메모 중심, 팁은 살짝
  so_yeon: {
    chance: 0.05,
    noteTextIds: ["gift.core.so_yeon.note1", "gift.core.so_yeon.note2"],
    tipCoinsMin: 0,
    tipCoinsMax: 3,
  },
  // 동현: 단정하고 실용적인 톤 — 팁은 소액이지만 안정적으로
  dong_hyun: {
    chance: 0.052,
    noteTextIds: ["gift.core.dong_hyun.note1", "gift.core.dong_hyun.note2"],
    tipCoinsMin: 1,
    tipCoinsMax: 4,
  },
};

function defaultRuntimeState(profile: CustomerProfile): CustomerRuntimeState {
  return {
    affection: profile.baseAffection,
    isRegular: false,
    storyIndex: 0,
    lastAffectionAtMs: 0,
  };
}

function ensureStateFor(
  byId: Record<CustomerId, CustomerRuntimeState>,
  id: CustomerId,
): CustomerRuntimeState {
  return byId[id] ?? defaultRuntimeState(PROFILE_INDEX[id] ?? SAMPLE_CUSTOMERS[0]);
}

function createDefaultCustomerSaveState(): CustomerSaveState {
  return {
    byId: Object.fromEntries(
      SAMPLE_CUSTOMERS.map((c) => [c.id, defaultRuntimeState(c)]),
    ) as Record<CustomerId, CustomerRuntimeState>,
    featuredCustomerId: SAMPLE_CUSTOMERS[0].id,
    featuredDailyQuotaTotal: 1,
    featuredDailyQuotaUsed: 0,
    featuredQuotaDayKey: 0,
    lastFeaturedDayKey: 0,
  };
}

function normalizeDayKey(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

function normalizeCustomerSaveState(input: unknown): CustomerSaveState {
  const defaults = createDefaultCustomerSaveState();
  if (!input || typeof input !== "object") {
    return defaults;
  }

  const raw = input as Partial<CustomerSaveState> & Record<string, unknown>;
  const byIdInput =
    raw.byId && typeof raw.byId === "object"
      ? (raw.byId as Record<string, Partial<CustomerRuntimeState>>)
      : {};

  const byId = Object.fromEntries(
    SAMPLE_CUSTOMERS.map((profile) => {
      const prev = byIdInput[profile.id];
      const affection =
        typeof prev?.affection === "number" && Number.isFinite(prev.affection)
          ? Math.max(0, Math.floor(prev.affection))
          : profile.baseAffection;
      const storyIndex = Math.max(
        typeof prev?.storyIndex === "number" && Number.isFinite(prev.storyIndex)
          ? Math.max(0, Math.floor(prev.storyIndex))
          : 0,
        clampStoryIndex(profile, affection),
      );
      return [
        profile.id,
        {
          affection,
          isRegular: typeof prev?.isRegular === "boolean" ? prev.isRegular : false,
          storyIndex,
          lastAffectionAtMs:
            typeof prev?.lastAffectionAtMs === "number" &&
            Number.isFinite(prev.lastAffectionAtMs)
              ? Math.max(0, Math.floor(prev.lastAffectionAtMs))
              : 0,
        },
      ];
    }),
  ) as Record<CustomerId, CustomerRuntimeState>;

  const featuredCustomerId = SAMPLE_CUSTOMERS.some(
    (customer) => customer.id === raw.featuredCustomerId,
  )
    ? (raw.featuredCustomerId as CustomerId)
    : defaults.featuredCustomerId;

  const featuredDailyQuotaTotal =
    typeof raw.featuredDailyQuotaTotal === "number" &&
    Number.isFinite(raw.featuredDailyQuotaTotal)
      ? Math.min(2, Math.max(1, Math.floor(raw.featuredDailyQuotaTotal)))
      : defaults.featuredDailyQuotaTotal;

  const featuredDailyQuotaUsed =
    typeof raw.featuredDailyQuotaUsed === "number" &&
    Number.isFinite(raw.featuredDailyQuotaUsed)
      ? Math.min(
          featuredDailyQuotaTotal,
          Math.max(0, Math.floor(raw.featuredDailyQuotaUsed)),
        )
      : defaults.featuredDailyQuotaUsed;

  return {
    byId,
    featuredCustomerId,
    featuredDailyQuotaTotal,
    featuredDailyQuotaUsed,
    featuredQuotaDayKey: normalizeDayKey(raw.featuredQuotaDayKey),
    lastFeaturedDayKey: normalizeDayKey(raw.lastFeaturedDayKey),
  };
}

function normalizeImportedSaleSession(input: unknown): SaleSessionState | null {
  if (!input || typeof input !== "object") return null;

  const raw = input as Partial<SaleSessionState>;
  if (!Array.isArray(raw.queue)) return null;
  const known = new Set(SAMPLE_CUSTOMERS.map((customer) => customer.id));
  const queue = raw.queue.filter((id): id is CustomerId => known.has(id));
  if (queue.length === 0) return null;

  return {
    startedAtMs:
      typeof raw.startedAtMs === "number" && Number.isFinite(raw.startedAtMs)
        ? Math.max(0, Math.floor(raw.startedAtMs))
        : 0,
    queue,
    currentRemainingCups:
      typeof raw.currentRemainingCups === "number" &&
      Number.isFinite(raw.currentRemainingCups)
        ? Math.max(1, Math.floor(raw.currentRemainingCups))
        : 1,
    featuredQueued:
      typeof raw.featuredQueued === "boolean" ? raw.featuredQueued : false,
  };
}

function calendarDayKeyUtc(nowMs: number): number {
  return Math.floor(nowMs / 86_400_000);
}

function featuredCustomerIdForDay(dayKey: number): CustomerId {
  const ids = SAMPLE_CUSTOMERS.map((c) => c.id);
  return ids[((dayKey % ids.length) + ids.length) % ids.length] ?? ids[0];
}

function xorshift32(seed: number): () => number {
  let x = seed | 0;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}

function expandSoldMenus(
  soldCount: number,
  soldByMenu?: Partial<Record<DrinkMenuId, number>>,
): DrinkMenuId[] {
  if (!soldByMenu) return new Array(soldCount).fill("americano");
  const out: DrinkMenuId[] = [];
  for (const mid of MENU_ORDER) {
    const n = soldByMenu[mid] ?? 0;
    for (let i = 0; i < n; i += 1) out.push(mid);
  }
  // 집계가 살짝 어긋난 경우는 안전하게 패딩
  while (out.length < soldCount) out.push(out[out.length - 1] ?? "americano");
  return out.slice(0, soldCount);
}

function pickWeighted(rng: () => number, ids: CustomerId[], weights: number[]): CustomerId {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return ids[0] ?? SAMPLE_CUSTOMERS[0].id;
  let r = (rng() % 10_000) / 10_000;
  let acc = 0;
  for (let i = 0; i < ids.length; i += 1) {
    acc += Math.max(0, weights[i] ?? 0) / total;
    if (r <= acc) return ids[i]!;
  }
  return ids[ids.length - 1] ?? SAMPLE_CUSTOMERS[0].id;
}

function pickIntInRange(rng: () => number, min: number, max: number): number {
  const a = Math.min(min, max);
  const b = Math.max(min, max);
  if (b <= a) return a;
  const u = (rng() % 10_000) / 10_000;
  return a + Math.floor(u * (b - a + 1));
}

function computeCoreGift(
  giverId: CustomerId,
  rng: () => number,
): { note: string; tipCoins: number } | null {
  const profile = CORE_GIFT_PROFILES[giverId];
  if (!profile) return null;
  const noteId =
    profile.noteTextIds[(rng() % profile.noteTextIds.length) | 0] ??
    profile.noteTextIds[0];
  const note = noteId ? t(noteId) : null;
  if (!note) return null;
  const tipCoins =
    profile.tipCoinsMax > 0
      ? pickIntInRange(rng, profile.tipCoinsMin, profile.tipCoinsMax)
      : 0;
  // tip이 0이 나오는 경우가 있어도 괜찮다(메모만 남김)
  return { note, tipCoins };
}

function cupsForGuest(
  profile: CustomerProfile,
  isRegular: boolean,
  rng: () => number,
): number {
  const u = (rng() % 10_000) / 10_000;
  let p2 = 0.1;
  if (profile.tags.includes("regular")) p2 = 0.3;
  else if (profile.tags.includes("sweet_tooth")) p2 = 0.2;
  else if (profile.tags.includes("late_night")) p2 = 0.15;
  if (isRegular) p2 = Math.min(0.45, p2 + 0.08);
  return u < p2 ? 2 : 1;
}

function generateVisitQueue(input: {
  rng: () => number;
  allIds: CustomerId[];
  featuredId: CustomerId;
  allowFeatured: boolean;
  length: number;
  byId: Record<CustomerId, CustomerRuntimeState>;
}): { queue: CustomerId[]; featuredQueued: boolean } {
  const others = input.allIds.filter((id) => id !== input.featuredId);
  const queue: CustomerId[] = [];
  // 기본은 균등. featured는 세션당 최대 1회만 들어오며, 들어온다면 약간 더 잘 보이게(확률만 상향).
  const includeFeatured =
    input.allowFeatured && PROFILE_INDEX[input.featuredId] != null
      ? (input.rng() % 10_000) / 10_000 < 0.6
      : false;

  while (queue.length < input.length) {
    const pickPool = others.length > 0 ? others : input.allIds;
    const weights = pickPool.map((id) => (input.byId[id]?.isRegular ? 1.35 : 1));
    queue.push(pickWeighted(input.rng, pickPool, weights));
  }

  if (includeFeatured && queue.length > 0) {
    const pos = (input.rng() % queue.length) | 0;
    queue[pos] = input.featuredId;
  }

  return { queue, featuredQueued: includeFeatured };
}

function featuredDailyQuotaForDay(dayKey: number): number {
  // dayKey 기반으로 1 또는 2회 방문 (대략 55%는 1회, 45%는 2회)
  const rng = xorshift32((dayKey * 1103515245 + 12345) >>> 0);
  return (rng() % 10_000) / 10_000 < 0.55 ? 1 : 2;
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      ...createDefaultCustomerSaveState(),
      lastCounterSalePing: null,
      lastStoryUnlockPing: null,
      saleSession: null,
      lastRegularGiftPing: null,
      lastPreferenceHookPing: null,
      lastRegularGiftAtMs: 0,

      shopAffection: () => {
        const byId = get().byId;
        return Object.values(byId).reduce((sum, s) => sum + (s.affection ?? 0), 0);
      },

      profile: (id) => PROFILE_INDEX[id] ?? null,

      stateOf: (id) => {
        const p = PROFILE_INDEX[id];
        if (!p) return null;
        const s = get().byId[id];
        return s ?? defaultRuntimeState(p);
      },

      ensureFeaturedQuotaForToday: (nowMs) => {
        const now = nowMs ?? Date.now();
        const dayKey = calendarDayKeyUtc(now);
        const s = get();
        if (s.featuredQuotaDayKey === dayKey && s.featuredDailyQuotaTotal > 0) return;
        const total = featuredDailyQuotaForDay(dayKey);
        set({
          featuredQuotaDayKey: dayKey,
          featuredDailyQuotaTotal: total,
          featuredDailyQuotaUsed: 0,
        });
      },

      ensureSaleSession: (nowMs) => {
        const now = nowMs ?? Date.now();
        const s = get();
        if (s.saleSession) return;
        get().ensureFeaturedQuotaForToday(now);
        const ids = SAMPLE_CUSTOMERS.map((c) => c.id);
        const featured = s.featuredCustomerId;
        const canFeatureMore =
          s.featuredDailyQuotaUsed < s.featuredDailyQuotaTotal;
        const seed = (now ^ (calendarDayKeyUtc(now) * 2654435761)) >>> 0;
        const rng = xorshift32(seed);
        const { queue, featuredQueued } = generateVisitQueue({
          rng,
          allIds: ids,
          featuredId: featured,
          allowFeatured: canFeatureMore,
          length: 8,
          byId: s.byId,
        });
        const firstId = queue[0] ?? ids[0]!;
        const firstProfile = PROFILE_INDEX[firstId] ?? SAMPLE_CUSTOMERS[0];
        const firstIsRegular = s.byId[firstId]?.isRegular ?? false;
        set({
          saleSession: {
            startedAtMs: now,
            queue,
            currentRemainingCups: cupsForGuest(firstProfile, firstIsRegular, rng),
            featuredQueued,
          },
        });
      },

      clearSaleSession: () => {
        set({ saleSession: null });
      },

      recordCafeSale: ({ soldCount, soldByMenu, nowMs }) => {
        if (soldCount <= 0) return null;
        const now = nowMs ?? Date.now();
        get().ensureFeaturedQuotaForToday(now);
        get().ensureSaleSession(now);

        const menus = expandSoldMenus(soldCount, soldByMenu);
        const ids = SAMPLE_CUSTOMERS.map((c) => c.id);
        const featured = get().featuredCustomerId;
        const seed = ((get().saleSession?.startedAtMs ?? now) ^ (menus.length * 97531)) >>> 0;
        const rng = xorshift32(seed);

        // 손님별로 이번 배치에서 구매한 잔 수/메뉴를 집계
        const perBuyer: Record<
          CustomerId,
          { soldCount: number; soldByMenu: Partial<Record<DrinkMenuId, number>> }
        > = {};

        let session = get().saleSession;
        if (!session) return null;

        const ensureQueueHasNext = () => {
          if (session!.queue.length > 0) return;
          const next = generateVisitQueue({
            rng,
            allIds: ids,
            featuredId: featured,
            allowFeatured: !session!.featuredQueued,
            length: 8,
            byId: get().byId,
          });
          session = { ...session!, queue: next.queue, featuredQueued: session!.featuredQueued || next.featuredQueued };
        };

        const ensureCurrentCups = (currentId: CustomerId) => {
          if (session!.currentRemainingCups > 0) return;
          const p = PROFILE_INDEX[currentId] ?? SAMPLE_CUSTOMERS[0];
          const isRegular = get().byId[currentId]?.isRegular ?? false;
          session = { ...session!, currentRemainingCups: cupsForGuest(p, isRegular, rng) };
        };

        for (const mid of menus) {
          ensureQueueHasNext();
          const currentId = session!.queue[0]!;
          ensureCurrentCups(currentId);

          perBuyer[currentId] ??= { soldCount: 0, soldByMenu: {} };
          perBuyer[currentId]!.soldCount += 1;
          perBuyer[currentId]!.soldByMenu[mid] = (perBuyer[currentId]!.soldByMenu[mid] ?? 0) + 1;

          const nextRemaining: number = session!.currentRemainingCups - 1;
          if (nextRemaining <= 0) {
            session = { ...session!, queue: session!.queue.slice(1), currentRemainingCups: 0 };
          } else {
            session = { ...session!, currentRemainingCups: nextRemaining };
          }
        }

        const buyerIds = Object.keys(perBuyer) as CustomerId[];
        if (buyerIds.length === 0) return null;
        const primaryId = buyerIds[0]!;
        const primaryProfile = PROFILE_INDEX[primaryId] ?? SAMPLE_CUSTOMERS[0];
        const buyerNames = buyerIds
          .map((cid) => {
            const p = PROFILE_INDEX[cid];
            return p ? t(p.nameTextId) : null;
          })
          .filter((x): x is string => Boolean(x));
        const buyerNamesShort = Array.from(new Set(buyerNames)).slice(0, 3);

        // 핵심 손님 흔적: "핵심 손님이 실제 구매" + (단골 or 일정 애정 이상) + 낮은 확률 + 전역 쿨다운
        const nowGiftOk = now - (get().lastRegularGiftAtMs ?? 0) >= 45_000;
        const eligibleCoreBuyers = buyerIds.filter((cid) => {
          if (!CORE_CUSTOMER_IDS.has(cid)) return false;
          const st = get().byId[cid];
          if (!st) return false;
          return st.isRegular || st.affection >= 6;
        });

        const candidateGiverId =
          nowGiftOk && eligibleCoreBuyers.length > 0
            ? eligibleCoreBuyers[(rng() % eligibleCoreBuyers.length) | 0]
            : null;
        const candidateGiftProfile = candidateGiverId
          ? CORE_GIFT_PROFILES[candidateGiverId]
          : null;
        const giftChance = candidateGiftProfile?.chance ?? 0.05;
        const shouldGift =
          candidateGiverId != null &&
          (rng() % 10_000) / 10_000 < giftChance;
        const giftGiverId = shouldGift ? candidateGiverId : null;
        const giftGiverProfile = giftGiverId ? PROFILE_INDEX[giftGiverId] : null;
        const giftGiverName = giftGiverProfile ? t(giftGiverProfile.nameTextId) : null;
        const computedGift =
          shouldGift && giftGiverId ? computeCoreGift(giftGiverId, rng) : null;
        const giftNote = computedGift?.note ?? null;
        const giftTipCoins = computedGift?.tipCoins ?? 0;

        if (shouldGift && giftTipCoins > 0) {
          const prevCoins = useAppStore.getState().playerResources.coins;
          useAppStore.getState().patchPlayerResources({ coins: prevCoins + giftTipCoins });
          useAppStore.getState().recordMissionEvent({
            type: "coinsEarned",
            amount: giftTipCoins,
            source: "gift",
          });
        }

        const featuredBatch = perBuyer[featured];
        if (!featuredBatch) {
          // featured가 이번 배치에 없으면 애정/스토리/선호 보너스는 발생하지 않는다.
          set((s) => {
            const shopAfter = Object.values(s.byId).reduce(
              (sum, st) => sum + (st.affection ?? 0),
              0,
            );
            return {
              saleSession: session,
              lastCounterSalePing: {
                atMs: now,
                gainedAffection: 0,
                shopAfter,
                buyerNames: buyerNamesShort,
              },
              lastRegularGiftPing:
                shouldGift && giftGiverName && giftNote
                  ? { atMs: now, giverName: giftGiverName, note: giftNote, tipCoins: giftTipCoins }
                  : s.lastRegularGiftPing,
              lastRegularGiftAtMs: shouldGift ? now : s.lastRegularGiftAtMs,
            };
          });
          return null;
        }

        // featured가 실제 구매했으므로, 오늘 quota를 1회 소진 (하루 총 1~2회 제한)
        // 같은 배치에서 여러 잔이어도 1회로 취급.
        set((s) => ({
          featuredDailyQuotaUsed: Math.min(
            s.featuredDailyQuotaTotal,
            (s.featuredDailyQuotaUsed ?? 0) + 1,
          ),
        }));

        // featured가 실제로 구매한 경우에만 애정/스토리/선호 보너스를 반영한다.
        let totalAff = 0;
        let totalPref = 0;
        let storyUnlockTitle: string | null = null;
        let preferenceHook: CustomerPreferenceHookResult | null = null;
        set((s) => {
          let nextById = { ...s.byId };
          const featuredProfile = PROFILE_INDEX[featured];
          if (featuredProfile) {
            const prev = ensureStateFor(nextById, featured);
            const { gainedAffection, preferredBonus } = affectionGainFromCafeSales(
              featuredProfile,
              featuredBatch.soldCount,
              featuredBatch.soldByMenu,
            );
            totalAff = gainedAffection;
            totalPref = preferredBonus;
            preferenceHook = resolvePreferenceHookForSale({
              profile: featuredProfile,
              soldByMenu: featuredBatch.soldByMenu,
              firstSoldBeverageIds: Object.entries(featuredBatch.soldByMenu)
                .map(([rawId, amount]) => {
                  const beverageId = beverageIdForRecipeId(rawId as DrinkMenuId);
                  const entry =
                    useAppStore.getState().beverageCodex.entries[beverageId];
                  return entry && entry.totalSold === (amount ?? 0)
                    ? beverageId
                    : null;
                })
                .filter((id): id is string => id != null),
              nowMs: now,
            });
            const next = nextRuntimeStateOnAffectionGain({
              profile: featuredProfile,
              prev,
              gainedAffection,
              nowMs: now,
            });
            if (next.storyIndex > prev.storyIndex) {
              storyUnlockTitle = t(featuredProfile.storySteps[next.storyIndex].titleTextId);
            }
            nextById[featured] = next;
          }
          const shopAfter = Object.values(nextById).reduce(
            (sum, st) => sum + (st.affection ?? 0),
            0,
          );
          return {
            byId: nextById,
            saleSession: session,
            lastCounterSalePing: {
              atMs: now,
              gainedAffection: totalAff,
              shopAfter,
              buyerNames: buyerNamesShort,
            },
            lastStoryUnlockPing: storyUnlockTitle
              ? { atMs: now, title: storyUnlockTitle }
              : s.lastStoryUnlockPing,
            lastPreferenceHookPing: preferenceHook
              ? {
                  atMs: now,
                  customerId: featured,
                  matchedTags: preferenceHook.matchedTags,
                  context: preferenceHook,
                }
              : s.lastPreferenceHookPing,
            lastRegularGiftPing:
              shouldGift && giftGiverName && giftNote
                ? { atMs: now, giverName: giftGiverName, note: giftNote, tipCoins: giftTipCoins }
                : s.lastRegularGiftPing,
            lastRegularGiftAtMs: shouldGift ? now : s.lastRegularGiftAtMs,
          };
        });

        if (storyUnlockTitle) {
          useAppStore.getState().recordMissionEvent({
            type: "collectionRegistered",
            collectionKind: "story",
            id: `${featured}:${storyUnlockTitle}`,
          });
        }

        return {
          gainedAffection: totalAff,
          customerDisplayName: t((PROFILE_INDEX[featured] ?? primaryProfile).nameTextId),
          shopAffectionAfter: get().shopAffection(),
          preferredBonus: totalPref,
          storyUnlockTitle,
        };
      },

      setFeaturedCustomer: (id) => {
        if (!PROFILE_INDEX[id]) return;
        set({ featuredCustomerId: id });
      },

      ensureFeaturedForToday: (nowMs) => {
        const now = nowMs ?? Date.now();
        const dayKey = calendarDayKeyUtc(now);
        const s = get();
        const fallbackId = featuredCustomerIdForDay(dayKey);
        if (!PROFILE_INDEX[s.featuredCustomerId]) {
          set({ featuredCustomerId: fallbackId, lastFeaturedDayKey: dayKey });
          return;
        }
        if (s.lastFeaturedDayKey === dayKey) return;
        set({ featuredCustomerId: fallbackId, lastFeaturedDayKey: dayKey });
      },
      exportCustomerSave: () => {
        const s = get();
        return {
          byId: s.byId,
          featuredCustomerId: s.featuredCustomerId,
          featuredDailyQuotaTotal: s.featuredDailyQuotaTotal,
          featuredDailyQuotaUsed: s.featuredDailyQuotaUsed,
          featuredQuotaDayKey: s.featuredQuotaDayKey,
          lastFeaturedDayKey: s.lastFeaturedDayKey,
        };
      },
      importCustomerSave: (data) => {
        if (!data || typeof data !== "object") return false;
        const next = normalizeCustomerSaveState(data);
        const nextSaleSession = normalizeImportedSaleSession(
          (data as { saleSession?: unknown }).saleSession,
        );
        set({
          ...next,
          lastCounterSalePing: null,
          lastStoryUnlockPing: null,
          saleSession: nextSaleSession,
          lastRegularGiftPing: null,
          lastPreferenceHookPing: null,
          lastRegularGiftAtMs: 0,
        });
        return true;
      },
      resetCustomerSave: () => {
        set({
          ...createDefaultCustomerSaveState(),
          lastCounterSalePing: null,
          lastStoryUnlockPing: null,
          saleSession: null,
          lastRegularGiftPing: null,
          lastPreferenceHookPing: null,
          lastRegularGiftAtMs: 0,
        });
      },
    }),
    {
      name: CUSTOMER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: CUSTOMER_STORAGE_VERSION,
      migrate: (persistedState, version) => {
        let state = persistedState as CustomerSaveState & Record<string, unknown>;
        if (version < 2) {
          state = {
            ...state,
            lastFeaturedDayKey: 0,
          } as CustomerSaveState & Record<string, unknown>;
        }
        if (version < 3) {
          const known = new Set(SAMPLE_CUSTOMERS.map((c) => c.id));
          const raw = (state.byId ?? {}) as Record<string, CustomerRuntimeState>;
          const pruned: Record<string, CustomerRuntimeState> = {};
          for (const kid of known) {
            if (raw[kid]) pruned[kid] = raw[kid];
          }
          for (const c of SAMPLE_CUSTOMERS) {
            if (!pruned[c.id]) pruned[c.id] = defaultRuntimeState(c);
          }
          let fid = state.featuredCustomerId as CustomerId;
          if (!known.has(fid)) {
            fid = SAMPLE_CUSTOMERS[0].id;
          }
          state = {
            ...state,
            byId: pruned,
            featuredCustomerId: fid,
          } as CustomerSaveState & Record<string, unknown>;
        }
        if (version < 4) {
          const raw = (state.byId ?? {}) as Record<string, CustomerRuntimeState>;
          const nextById: Record<string, CustomerRuntimeState> = {};
          for (const c of SAMPLE_CUSTOMERS) {
            const st = raw[c.id] ?? defaultRuntimeState(c);
            const coherent = Math.max(
              st.storyIndex ?? 0,
              clampStoryIndex(c, st.affection ?? 0),
            );
            nextById[c.id] = { ...st, storyIndex: coherent };
          }
          const known = new Set(SAMPLE_CUSTOMERS.map((x) => x.id));
          let fid = state.featuredCustomerId as CustomerId;
          if (!known.has(fid)) fid = SAMPLE_CUSTOMERS[0].id;
          state = {
            ...state,
            byId: nextById,
            featuredCustomerId: fid,
          } as CustomerSaveState & Record<string, unknown>;
        }
        if (version < 5) {
          const known = new Set(SAMPLE_CUSTOMERS.map((c) => c.id));
          const raw = (state.byId ?? {}) as Record<string, CustomerRuntimeState>;
          const nextById: Record<string, CustomerRuntimeState> = {};
          for (const c of SAMPLE_CUSTOMERS) {
            const st = raw[c.id] ?? defaultRuntimeState(c);
            nextById[c.id] = st;
          }
          const nowDayKey = state.featuredQuotaDayKey ?? 0;
          state = {
            ...state,
            byId: nextById,
            featuredCustomerId: known.has(state.featuredCustomerId as CustomerId)
              ? (state.featuredCustomerId as CustomerId)
              : SAMPLE_CUSTOMERS[0].id,
            featuredDailyQuotaTotal:
              typeof state.featuredDailyQuotaTotal === "number"
                ? state.featuredDailyQuotaTotal
                : 1,
            featuredDailyQuotaUsed:
              typeof state.featuredDailyQuotaUsed === "number"
                ? state.featuredDailyQuotaUsed
                : 0,
            featuredQuotaDayKey:
              typeof nowDayKey === "number" ? nowDayKey : 0,
          } as CustomerSaveState & Record<string, unknown>;
        }
        if (version < 6) {
          // 손님 풀 변경(핵심 손님 교체 + 일반 손님 확장) 반영: known id만 유지
          const raw = (state.byId ?? {}) as Record<string, CustomerRuntimeState>;
          const nextById: Record<string, CustomerRuntimeState> = {};
          for (const c of SAMPLE_CUSTOMERS) {
            nextById[c.id] = raw[c.id] ?? defaultRuntimeState(c);
          }
          state = {
            ...state,
            byId: nextById,
          } as CustomerSaveState & Record<string, unknown>;
        }
        return normalizeCustomerSaveState(state);
      },
      partialize: (s) => ({
        byId: s.byId,
        featuredCustomerId: s.featuredCustomerId,
        featuredDailyQuotaTotal: s.featuredDailyQuotaTotal,
        featuredDailyQuotaUsed: s.featuredDailyQuotaUsed,
        featuredQuotaDayKey: s.featuredQuotaDayKey,
        lastFeaturedDayKey: s.lastFeaturedDayKey,
      }),
    },
  ),
);
