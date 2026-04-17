"use client";

import { useEffect, useState } from "react";
import { t } from "@/locale/i18n";
import { formatPreferredMenuNames } from "@/features/customers/lib/menuLabels";
import { affectionRemainingToNextStoryUnlock } from "@/features/customers/lib/nextStoryGap";
import { useCustomerStore } from "@/stores/useCustomerStore";

const COUNTER_SALE_FEED_MS = 12_000;
const STORY_UNLOCK_FEED_MS = 12_000;
const REGULAR_GIFT_FEED_MS = 12_000;

/** 로비 메인: 오늘의 손님 · 가게 애정 (한 줄, 저자극) */
export function LobbyTodayGuestLine() {
  const [mounted, setMounted] = useState(false);
  const ensure = useCustomerStore((s) => s.ensureFeaturedForToday);
  const id = useCustomerStore((s) => s.featuredCustomerId);
  const profile = useCustomerStore((s) => s.profile(id));
  const name = profile ? t(profile.nameTextId) : t("common.guestDefault");
  const isRegular = useCustomerStore((s) => s.stateOf(id)?.isRegular ?? false);
  const shop = useCustomerStore((s) => s.shopAffection());
  /** persist(localStorage) 재수화 전·SSR과 첫 클라 페인트를 맞추기 위해 숫자는 마운트 후에만 표시 */
  const shopLine = mounted ? shop : "…";

  useEffect(() => {
    setMounted(true);
    ensure();
  }, [ensure]);

  return (
    <p className="mb-3 text-center text-[10px] leading-relaxed text-coffee-600/65">
      {t("hints.todayGuest.line", { name, shop: shopLine })}
      {mounted && isRegular ? (
        <span className="ml-1 align-middle text-[9px] font-semibold text-accent-soft/85">
          {t("hints.regular.badge")}
        </span>
      ) : null}
    </p>
  );
}

/** 카운터 바텀시트: 맥락용 짧은 줄 (판매와 애정 연결 감) */
export function CounterSheetTodayGuestHint() {
  const ensure = useCustomerStore((s) => s.ensureFeaturedForToday);
  const id = useCustomerStore((s) => s.featuredCustomerId);
  const profile = useCustomerStore((s) => s.profile(id));
  const name = profile ? t(profile.nameTextId) : t("common.guestDefault");
  const runtime = useCustomerStore((s) => s.stateOf(id));
  const affection = runtime?.affection ?? 0;
  const isRegular = runtime?.isRegular ?? false;
  const storyIndex = runtime?.storyIndex ?? 0;
  const shop = useCustomerStore((s) => s.shopAffection());
  const lastSalePing = useCustomerStore((s) => s.lastCounterSalePing);
  const lastStoryUnlockPing = useCustomerStore((s) => s.lastStoryUnlockPing);
  const lastRegularGiftPing = useCustomerStore((s) => s.lastRegularGiftPing);
  const sessionQueue = useCustomerStore((s) => s.saleSession?.queue ?? null);

  const [nowMs, setNowMs] = useState(() => Date.now());

  const preferredMenus =
    profile !== null ? formatPreferredMenuNames(profile, t) : "";
  const nextStoryGap =
    profile !== null
      ? affectionRemainingToNextStoryUnlock(profile, affection)
      : null;

  const showSaleFeed =
    lastSalePing != null &&
    nowMs - lastSalePing.atMs < COUNTER_SALE_FEED_MS &&
    nowMs >= lastSalePing.atMs;

  const showStoryUnlockFeed =
    lastStoryUnlockPing != null &&
    nowMs - lastStoryUnlockPing.atMs < STORY_UNLOCK_FEED_MS &&
    nowMs >= lastStoryUnlockPing.atMs;

  const showRegularGiftFeed =
    lastRegularGiftPing != null &&
    nowMs - lastRegularGiftPing.atMs < REGULAR_GIFT_FEED_MS &&
    nowMs >= lastRegularGiftPing.atMs;

  const unlockedStorySteps =
    profile !== null
      ? profile.storySteps.slice(0, storyIndex + 1)
      : [];

  useEffect(() => {
    ensure();
  }, [ensure]);

  useEffect(() => {
    if (!lastSalePing && !lastStoryUnlockPing && !lastRegularGiftPing) return;
    const tid = window.setInterval(() => setNowMs(Date.now()), 400);
    return () => clearInterval(tid);
  }, [lastSalePing, lastStoryUnlockPing, lastRegularGiftPing]);

  return (
    <div className="mb-4 rounded-2xl border border-coffee-600/8 bg-cream-200/35 px-3.5 py-2.5 ring-1 ring-coffee-600/6">
      <p className="text-[11px] font-semibold text-coffee-800">
        {t("hints.counter.title", { name })}
      </p>
      {isRegular ? (
        <p className="mt-0.5 text-[9px] font-semibold text-accent-soft/80">
          {t("hints.regular.badge")}
        </p>
      ) : null}
      {sessionQueue && sessionQueue.length > 0 ? (
        <p className="mt-1 text-[9px] leading-relaxed text-coffee-600/55">
          {(() => {
            const uniq: string[] = [];
            for (const cid of sessionQueue) {
              const p = useCustomerStore.getState().profile(cid);
              if (!p) continue;
              const n = t(p.nameTextId);
              if (!uniq.includes(n)) uniq.push(n);
              if (uniq.length >= 3) break;
            }
            const line = uniq.join(" · ");
            return t("hints.counter.sessionGuests", { guests: line || "…" });
          })()}
        </p>
      ) : null}
      {showSaleFeed && lastSalePing ? (
        <p className="mt-1.5 rounded-xl bg-accent-soft/12 px-2 py-1 text-[10px] leading-snug text-coffee-800/95 ring-1 ring-accent-soft/22">
          {t("hints.counter.saleFeed", {
            names: lastSalePing.buyerNames.join(" · ") || "…",
          })}
        </p>
      ) : null}
      {showSaleFeed && lastSalePing && lastSalePing.gainedAffection > 0 ? (
        <p className="mt-1 text-[9px] leading-relaxed text-coffee-600/65">
          {t("hints.counter.saleAffection", { gained: lastSalePing.gainedAffection })}
        </p>
      ) : null}
      {showRegularGiftFeed && lastRegularGiftPing ? (
        <p className="mt-2 rounded-xl bg-cream-50/70 px-2 py-1 text-[10px] leading-snug text-coffee-800/90 ring-1 ring-coffee-600/8">
          {lastRegularGiftPing.tipCoins > 0
            ? t("hints.counter.regularGiftWithTip", {
                name: lastRegularGiftPing.giverName,
                note: lastRegularGiftPing.note,
                coins: lastRegularGiftPing.tipCoins,
              })
            : t("hints.counter.regularGift", {
                name: lastRegularGiftPing.giverName,
                note: lastRegularGiftPing.note,
              })}
        </p>
      ) : null}
      {profile?.introTextId ? (
        <p className="mt-1 text-[10px] leading-relaxed text-coffee-600/72">
          {t(profile.introTextId)}
        </p>
      ) : null}
      {preferredMenus ? (
        <p className="mt-1 text-[10px] leading-relaxed text-coffee-600/78">
          {t("hints.counter.prefLine", { menus: preferredMenus })}
        </p>
      ) : null}
      {unlockedStorySteps.length > 0 ? (
        <div className="mt-2 rounded-xl border border-coffee-600/6 bg-cream-50/55 px-2.5 py-2 ring-1 ring-coffee-600/5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-coffee-600/48">
            {t("hints.counter.storyHeading")}
          </p>
          <ul className="mt-1.5 space-y-1">
            {unlockedStorySteps.map((step) => (
              <li
                key={step.id}
                className="text-[10px] leading-snug text-coffee-800/88"
              >
                <span className="text-coffee-600/55" aria-hidden>
                  ·{" "}
                </span>
                {t(step.titleTextId)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {showStoryUnlockFeed && lastStoryUnlockPing ? (
        <p className="mt-2 rounded-xl bg-accent-mint/10 px-2 py-1 text-[10px] leading-snug text-coffee-800/92 ring-1 ring-accent-mint/18">
          {t("hints.counter.storyUnlockFeed", {
            title: lastStoryUnlockPing.title,
          })}
        </p>
      ) : null}
      {nextStoryGap !== null ? (
        <>
          <p className="mt-1 text-[10px] leading-relaxed text-coffee-600/85">
            {t("hints.counter.affectionNext", { affection, remain: nextStoryGap })}
          </p>
          <p className="mt-0.5 text-[9px] leading-relaxed text-coffee-600/55">
            {t("hints.counter.shopFoot", { shop })}
          </p>
        </>
      ) : (
        <p className="mt-1 text-[10px] leading-relaxed text-coffee-600/85">
          {t("hints.counter.affectionLineDone", { affection, shop })}
        </p>
      )}
    </div>
  );
}
