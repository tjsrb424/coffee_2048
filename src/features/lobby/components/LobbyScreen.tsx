"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { HeartIcon } from "@/components/ui/HeartIcon";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import { CAFE_ECONOMY, MENU_ORDER } from "@/features/meta/balance/cafeEconomy";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import type { LobbySheetId } from "@/features/lobby/config/lobbyHotspots";
import {
  LOBBY_SHEET_DESCRIPTION_ID,
  LOBBY_SHEET_TAGLINE_ID,
  LOBBY_SHEET_TITLE_ID,
} from "@/features/lobby/config/lobbySheetCopy";
import { buildLobbySheetSummary } from "@/features/lobby/lib/lobbySheetSummary";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { runSceneTransition } from "@/lib/runSceneTransition";
import { t } from "@/locale/i18n";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/stores/useAppStore";
import {
  CafeLoopSection,
  type CafeLoopSectionKey,
} from "./CafeLoopSection";
import { LobbyBottomSheet } from "./LobbyBottomSheet";
import { RoasterSheetTopOverlap } from "./RoasterSheetTopOverlap";
import { WorkbenchSheetTopOverlap } from "./WorkbenchSheetTopOverlap";
import { CounterSheetTopOverlap } from "./CounterSheetTopOverlap";
import { CounterSellPulseToast } from "./CounterSellPulseToast";
import { OfflineSalesCard } from "./OfflineSalesCard";
import {
  LobbyTodayGuestLine,
  CounterSheetTodayGuestHint,
} from "@/features/customers/components/CustomerPresenceHints";
import { ResourceBar } from "./ResourceBar";
import { LobbyPanelQuerySync } from "./LobbyPanelQuerySync";

type OpenSheet = {
  sheet: LobbySheetId;
  cafeSections?: CafeLoopSectionKey[];
} | null;

export function LobbyScreen() {
  useResetDocumentScrollOnMount();
  const lobbyOnboardingSeen = useAppStore(
    (s) => s.settings?.lobbyOnboardingSeen ?? false,
  );
  const patchSettings = useAppStore((s) => s.patchSettings);
  const playerResources = useAppStore((s) => s.playerResources);
  const puzzleProgress = useAppStore((s) => s.puzzleProgress);
  const cafeState = useAppStore((s) => s.cafeState);
  const consumeHeart = useAppStore((s) => s.consumePuzzleHeart);
  const router = useRouter();

  const [open, setOpen] = useState<OpenSheet>(null);

  const openCafeFromQuery = useCallback(() => {
    setOpen({ sheet: "showcase", cafeSections: ["craft"] });
  }, []);

  const openSheet = useCallback(
    (sheet: LobbySheetId, cafeSections?: CafeLoopSectionKey[]) =>
      setOpen({ sheet, cafeSections }),
    [],
  );

  const closeSheet = useCallback(() => setOpen(null), []);

  const title = open ? t(LOBBY_SHEET_TITLE_ID[open.sheet]) : "";
  const tagline = open ? t(LOBBY_SHEET_TAGLINE_ID[open.sheet]) : undefined;
  const description = open
    ? LOBBY_SHEET_DESCRIPTION_ID[open.sheet]
      ? t(LOBBY_SHEET_DESCRIPTION_ID[open.sheet]!)
      : undefined
    : undefined;

  const summary = useMemo(() => {
    if (!open) return "";
    return buildLobbySheetSummary(open.sheet, {
      playerResources,
      puzzleProgress,
      cafeState,
    });
  }, [open, playerResources, puzzleProgress, cafeState]);

  const menuTotalStock = useMemo(
    () =>
      cafeState.menuStock.americano +
      cafeState.menuStock.latte +
      cafeState.menuStock.affogato,
    [cafeState.menuStock],
  );

  const craftableHint = useMemo(() => {
    const beans = playerResources.beans;
    const shots = cafeState.espressoShots;
    for (const id of MENU_ORDER) {
      const r = CAFE_ECONOMY.recipe[id];
      if (shots >= r.shots && beans >= r.beans) return t("lobby.ops.craftHint.craftable");
    }
    return shots < 1
      ? t("lobby.ops.craftHint.baseShort")
      : t("lobby.ops.craftHint.resourceShort");
  }, [cafeState.espressoShots, playerResources.beans]);

  return (
    <>
      <Suspense fallback={null}>
        <LobbyPanelQuerySync onCafePanelFromQuery={openCafeFromQuery} />
      </Suspense>
      <AppShell className="pt-4 sm:pt-5">
        <header className="mb-3 flex flex-col gap-2.5">
          <nav className="flex w-full shrink-0 justify-end gap-2 text-[11px] font-semibold text-coffee-700">
            <Link
              href="/settings"
              className="rounded-full bg-cream-200/80 px-2.5 py-1.5 ring-1 ring-coffee-600/10 hover:bg-cream-200"
            >
              {t("nav.settings")}
            </Link>
            <Link
              href="/shop"
              className="rounded-full bg-cream-200/80 px-2.5 py-1.5 ring-1 ring-coffee-600/10 hover:bg-cream-200"
            >
              {t("nav.shop")}
            </Link>
            <Link
              href="/menu"
              className="rounded-full bg-cream-200/80 px-2.5 py-1.5 ring-1 ring-coffee-600/10 hover:bg-cream-200"
            >
              {t("nav.menu")}
            </Link>
          </nav>
          <div className="pointer-events-none flex w-full justify-center px-0.5">
            <div className="w-full max-w-[432px] sm:max-w-[468px]">
              <Image
                src={publicAssetPath("/images/brand/cafe-2048-title-2.png")}
                alt="Cafe 2048"
                width={1115}
                height={584}
                priority
                sizes="(max-width: 640px) 432px, 468px"
                className="mx-auto h-auto w-full max-h-[6.6rem] object-contain object-center drop-shadow-[0_1px_2px_rgb(62_47_35_/_0.12)] sm:max-h-[7.85rem]"
              />
            </div>
          </div>
          <h1 className="sr-only">{t("lobby.srOnly.todayShop")}</h1>
        </header>

        {!lobbyOnboardingSeen ? (
          <div className="mb-2 flex items-start gap-2 rounded-2xl bg-cream-200/50 px-3 py-2.5 ring-1 ring-accent-soft/25">
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-coffee-800">
              {t("lobby.onboarding.hint")}
            </p>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0 px-2 py-1 text-xs"
              onClick={() => patchSettings({ lobbyOnboardingSeen: true })}
            >
              {t("lobby.onboarding.dismiss")}
            </Button>
          </div>
        ) : null}

        <LobbyTodayGuestLine />

        <ResourceBar variant="compact" className="mb-3" />

        <LobbyOpsDashboard
          beans={playerResources.beans}
          hearts={playerResources.hearts}
          bestTile={puzzleProgress.bestTile}
          shots={cafeState.espressoShots}
          menuTotalStock={menuTotalStock}
          displaySellingActive={cafeState.displaySellingActive}
          autoSellIntervalMs={getCafeRuntimeModifiers(cafeState).autoSellIntervalMs}
          craftHint={craftableHint}
          lastOfflineCoins={cafeState.lastOfflineSaleCoins}
          onOpenRoast={() => openSheet("roast", ["roast"])}
          onOpenShowcase={() => openSheet("showcase", ["craft"])}
          onOpenCounter={() => openSheet("counter")}
          onOpenPuzzle={() => {
            if (!consumeHeart()) return;
            window.dispatchEvent(
              new CustomEvent("coffee:request-bgm-fadeout", { detail: { ms: 1200 } }),
            );
            runSceneTransition(() => router.push("/puzzle"), "/puzzle");
          }}
        />
      </AppShell>

      <LobbyBottomSheet
        open={open !== null}
        title={title}
        tagline={tagline}
        floatingNotice={
          open?.sheet === "counter" ? <CounterSellPulseToast /> : undefined
        }
        floatingNoticeClassName={
          open?.sheet === "counter"
            ? "-translate-y-[calc(100%+8.5rem)] sm:-translate-y-[calc(100%+9.5rem)]"
            : undefined
        }
        summary={
          open?.sheet === "roast" ||
          open?.sheet === "showcase" ||
          open?.sheet === "counter"
            ? undefined
            : summary
        }
        description={description}
        onClose={closeSheet}
        topOverlap={
          open?.sheet === "roast" ? (
            <RoasterSheetTopOverlap />
          ) : open?.sheet === "counter" ? (
            <CounterSheetTopOverlap />
          ) : open?.sheet === "showcase" ? (
            <WorkbenchSheetTopOverlap />
          ) : undefined
        }
        headerAlign={
          open?.sheet === "roast" ||
          open?.sheet === "showcase" ||
          open?.sheet === "counter"
            ? "center"
            : "default"
        }
        titleSize={
          open?.sheet === "roast" ||
          open?.sheet === "showcase" ||
          open?.sheet === "counter"
            ? "xl"
            : "default"
        }
        topOverlapHeaderPaddingClassName={
          open?.sheet === "roast"
            ? "pt-[9.25rem] sm:pt-[10.5rem]"
            : open?.sheet === "counter"
              ? "pt-[7rem] sm:pt-32"
            : open?.sheet === "showcase"
              ? /* 일러스트 불투명 부분과 겹치지 않도록: 투명 영역(상단 띠)에만 겹치게 패딩 확보 */
                "pt-[7rem] sm:pt-32"
              : undefined
        }
      >
        {open?.sheet === "roast" && (
          <CafeLoopSection sections={open.cafeSections ?? ["roast"]} />
        )}
        {open?.sheet === "showcase" && (
          <CafeLoopSection sections={open.cafeSections ?? ["craft"]} />
        )}
        {open?.sheet === "counter" && (
          <>
            <CounterSheetTodayGuestHint />
            {menuTotalStock === 0 ? (
              <Card className="mb-4 border border-accent-soft/25 bg-cream-50/95 p-4 ring-1 ring-coffee-600/8">
                <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
                  {t("lobby.counter.empty.title")}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-coffee-800">
                  {t("lobby.counter.empty.body")}
                </p>
                <Link
                  href="/lobby?panel=cafe"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-cream-200/90 px-3 py-2.5 text-center text-xs font-semibold text-coffee-900 ring-1 ring-accent-soft/30 hover:bg-cream-200"
                  onClick={closeSheet}
                >
                  {t("lobby.counter.empty.cta")}
                </Link>
              </Card>
            ) : null}
            <CafeLoopSection sections={["display"]} />
            <div className="space-y-4">
              <OfflineSalesCard />
            </div>
          </>
        )}
        {open && open.sheet !== "puzzle" ? (
          <p className="mt-4 text-center text-xs text-coffee-600/70">
            <Link
              href="/cafe"
              className="font-semibold underline-offset-2 hover:underline"
              onClick={closeSheet}
            >
              {t("lobby.cafeFallback.title")}
            </Link>
            {t("lobby.cafeFallback.suffix")}
          </p>
        ) : null}
      </LobbyBottomSheet>
    </>
  );
}

function LobbyOpsDashboard({
  beans,
  hearts,
  bestTile,
  shots,
  menuTotalStock,
  displaySellingActive,
  autoSellIntervalMs,
  craftHint,
  lastOfflineCoins,
  onOpenRoast,
  onOpenShowcase,
  onOpenCounter,
  onOpenPuzzle,
}: {
  beans: number;
  hearts: number;
  bestTile: number;
  shots: number;
  menuTotalStock: number;
  displaySellingActive: boolean;
  autoSellIntervalMs: number;
  craftHint: string;
  lastOfflineCoins: number;
  onOpenRoast: () => void;
  onOpenShowcase: () => void;
  onOpenCounter: () => void;
  onOpenPuzzle: () => void;
}) {
  const sellSec = (autoSellIntervalMs / 1000).toFixed(1);
  const showcaseStatus =
    menuTotalStock > 0
      ? displaySellingActive
        ? t("lobby.ops.showcaseStatus.selling", { count: menuTotalStock })
        : t("lobby.ops.showcaseStatus.idle", { count: menuTotalStock })
      : t("lobby.ops.showcaseStatus.empty", { hint: craftHint });
  const cardLabelClass =
    "text-[11px] font-semibold uppercase tracking-[0.06em] text-coffee-600/60";
  const cardStatusClass =
    "mt-3 text-[15px] font-semibold leading-snug tracking-tight text-coffee-900";
  const cardDescClass =
    "mt-2.5 text-xs leading-[1.55] text-coffee-700/80 [word-break:keep-all]";

  return (
    <section className="mb-2">
      <div className="grid grid-cols-2 items-stretch gap-4 sm:gap-5">
        <Card className="col-span-2 flex flex-col p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="min-w-0 flex-1 space-y-3">
              <div className={cardLabelClass}>{t("lobby.card.label.puzzle")}</div>
              <p className="inline-flex flex-wrap items-center gap-2 text-[15px] font-semibold leading-snug text-coffee-900">
                <span className="inline-flex items-center gap-1">
                  <HeartIcon size={18} className="opacity-95" />
                  <span className="tabular-nums">{hearts}</span>
                  <span className="sr-only">하트</span>
                </span>
                <span className="text-coffee-600/45" aria-hidden>
                  ·
                </span>
                <span>{t("lobby.card.puzzle.statsBestTile", { bestTile })}</span>
              </p>
              <p className="text-xs leading-[1.55] text-coffee-700/80">
                {t("lobby.card.puzzle.desc")}
              </p>
            </div>
            <Button
              type="button"
              variant="soft"
              className="h-12 w-full shrink-0 sm:h-11 sm:w-[8rem]"
              onClick={onOpenPuzzle}
            >
              {t("lobby.card.puzzle.cta")}
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-[192px] flex-col p-6 sm:p-5 md:p-6">
          <div className={cardLabelClass}>{t("lobby.card.label.roast")}</div>
          <p className={cardStatusClass}>
            {t("lobby.card.roast.status", { beans, shots })}
          </p>
          <p className={cardDescClass}>{t("lobby.card.roast.desc")}</p>
          <div className="mt-auto pt-5">
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full text-xs font-semibold text-coffee-900 sm:h-11"
              onClick={onOpenRoast}
            >
              {t("lobby.card.roast.cta")}
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-[192px] flex-col p-6 sm:p-5 md:p-6">
          <div className={cardLabelClass}>{t("lobby.card.label.showcase")}</div>
          <p className={cardStatusClass}>{showcaseStatus}</p>
          <p className={cardDescClass}>
            {t("lobby.card.showcase.desc1")}
            <br className="sm:hidden" />
            {t("lobby.card.showcase.desc2")}
          </p>
          <div className="mt-auto pt-5">
            <Button
              type="button"
              variant="soft"
              className="h-12 w-full text-xs font-semibold sm:h-11"
              onClick={onOpenShowcase}
            >
              {t("lobby.card.showcase.cta")}
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-[192px] flex-col p-6 sm:p-5 md:p-6">
          <div className={cardLabelClass}>{t("lobby.sheet.counter.title")}</div>
          <p className={cardStatusClass}>
            {menuTotalStock > 0 ? (
              displaySellingActive ? (
                <>
                  {t("lobby.card.counter.sellingLive.prefix")}{" "}
                  <span className="tabular-nums">
                    {sellSec}
                    {t("lobby.card.counter.selling.unit")}
                  </span>
                </>
              ) : (
                t("lobby.card.counter.waitStart")
              )
            ) : (
              <>
                {t("lobby.card.counter.emptyLine1")}
                <br className="sm:hidden" />
                <span className="sm:ml-1">{t("lobby.card.counter.emptyLine2")}</span>
              </>
            )}
          </p>
          <p className={cardDescClass}>
            {lastOfflineCoins > 0 ? (
              <span className="inline-flex flex-wrap items-center gap-1">
                {t("lobby.ops.offline.withCoinsLead")}
                <CoinIcon size={16} className="opacity-95" />
                <span className="tabular-nums font-semibold">{lastOfflineCoins}</span>
                <span className="sr-only">코인</span>
              </span>
            ) : (
              t("lobby.ops.offline.none")
            )}
          </p>
          <div className="mt-auto pt-5">
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-full text-xs font-semibold text-coffee-900 sm:h-11"
              onClick={onOpenCounter}
            >
              {t("lobby.card.counter.cta")}
            </Button>
          </div>
        </Card>

        <Card className="flex min-h-[192px] flex-col p-6 sm:p-5 md:p-6">
          <div className={cardLabelClass}>{t("lobby.card.label.today")}</div>
          <p className={cardStatusClass}>
            {menuTotalStock > 0
              ? displaySellingActive
                ? t("lobby.card.today.selling")
                : t("lobby.card.today.idle")
              : t("lobby.card.today.empty")}
          </p>
          <p className={`${cardDescClass} flex-1`}>
            {menuTotalStock > 0 ? (
              displaySellingActive ? (
                <>
                  {t("lobby.card.today.sellingDesc1", { sec: sellSec })}
                  <br className="sm:hidden" />
                  {t("lobby.card.today.sellingDesc2")}
                </>
              ) : (
                <>
                  {t("lobby.card.today.idleDesc1")}
                  <br className="sm:hidden" />
                  {t("lobby.card.today.idleDesc2")}
                </>
              )
            ) : (
              <>
                {t("lobby.card.today.emptyDesc1")}
                <br className="sm:hidden" />
                {t("lobby.card.today.emptyDesc2")}
              </>
            )}
          </p>
          <div className="mt-auto pt-5" aria-hidden>
            <div className="h-12 sm:h-11" />
          </div>
        </Card>
      </div>
    </section>
  );
}
