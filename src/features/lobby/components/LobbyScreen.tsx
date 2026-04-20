"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
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
import { playCounterOpen, playRoasterOpen, playWorkbenchOpen } from "@/lib/sfx";
import { cn } from "@/lib/utils";
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
import { CounterSheetTodayGuestHint } from "@/features/customers/components/CustomerPresenceHints";
import { ResourceBar } from "./ResourceBar";
import { LobbyPanelQuerySync } from "./LobbyPanelQuerySync";

type OpenSheet = {
  sheet: LobbySheetId;
  cafeSections?: CafeLoopSectionKey[];
} | null;

export function LobbyScreen() {
  useResetDocumentScrollOnMount();
  const reduceMotion = !!useReducedMotion();
  const lobbyOnboardingSeen = useAppStore(
    (s) => s.settings?.lobbyOnboardingSeen ?? false,
  );
  const patchSettings = useAppStore((s) => s.patchSettings);
  const playerResources = useAppStore((s) => s.playerResources);
  const puzzleProgress = useAppStore((s) => s.puzzleProgress);
  const cafeState = useAppStore((s) => s.cafeState);
  const consumeHeart = useAppStore((s) => s.consumePuzzleHeart);
  const soundOn = useAppStore((s) => s.settings.soundOn);
  const router = useRouter();

  const [open, setOpen] = useState<OpenSheet>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/puzzle");
  }, [router]);

  const openCafeFromQuery = useCallback(() => {
    setOpen({ sheet: "showcase", cafeSections: ["craft"] });
  }, []);

  const openSheet = useCallback(
    (sheet: LobbySheetId, cafeSections?: CafeLoopSectionKey[]) =>
      setOpen({ sheet, cafeSections }),
    [],
  );

  const closeSheet = useCallback(() => setOpen(null), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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

  return (
    <>
      <Suspense fallback={null}>
        <LobbyPanelQuerySync onCafePanelFromQuery={openCafeFromQuery} />
      </Suspense>
      <AppShell className="pt-1.5 sm:pt-2.5">
        <header className="relative mb-1.5 flex flex-col gap-0.5">
          <div className="absolute right-0 top-0 z-20">
            <LobbyTopMenu
              open={menuOpen}
              onToggle={() => setMenuOpen((v) => !v)}
              onClose={closeMenu}
              reduceMotion={reduceMotion}
            />
          </div>
          <div className="pointer-events-none flex w-full justify-center px-0.5">
            <div className="w-full max-w-[432px] sm:max-w-[468px]">
              <Image
                src={publicAssetPath("/images/optimized/brand/cafe-2048-title-2.webp")}
                alt="Cafe 2048"
                width={1115}
                height={584}
                priority
                sizes="(max-width: 640px) 432px, 468px"
                className="mx-auto h-auto w-full max-h-[6.3rem] object-contain object-center drop-shadow-[0_1px_2px_rgb(62_47_35_/_0.12)] sm:max-h-[7.4rem]"
              />
            </div>
          </div>
          <h1 className="sr-only">{t("lobby.srOnly.todayShop")}</h1>
        </header>

        {!lobbyOnboardingSeen ? (
          <div className="mb-2 flex items-start gap-2 rounded-2xl bg-cream-200/50 px-3 py-2 ring-1 ring-accent-soft/25">
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

        <ResourceBar variant="compact" className="mb-2" />

        <LobbyOpsDashboard
          onOpenRoast={() => {
            if (soundOn) playRoasterOpen();
            openSheet("roast", ["roast"]);
          }}
          onOpenShowcase={() => {
            if (soundOn) playWorkbenchOpen();
            openSheet("showcase", ["craft"]);
          }}
          onOpenCounter={() => {
            if (soundOn) playCounterOpen();
            openSheet("counter");
          }}
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
        {open && open.sheet !== "puzzle" && open.sheet !== "roast" ? (
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

function LobbyTopMenu({
  open,
  onToggle,
  onClose,
  reduceMotion,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={wrapRef} className="relative z-20 flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-50/90 text-coffee-800 shadow-card ring-1 ring-coffee-600/10 backdrop-blur-sm transition-colors hover:bg-cream-50"
      >
        <div className="flex w-[18px] flex-col gap-[3px]">
          <span
            className={cn(
              "h-[2px] rounded-full bg-current transition-transform duration-200",
              open && "translate-y-[5px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-[2px] rounded-full bg-current transition-opacity duration-200",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "h-[2px] rounded-full bg-current transition-transform duration-200",
              open && "-translate-y-[5px] -rotate-45",
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={
              reduceMotion
                ? { duration: 0.16 }
                : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
            }
            className="absolute right-0 top-[calc(100%+0.55rem)] min-w-[9rem] overflow-hidden rounded-[1.5rem] bg-cream-50/96 p-2 shadow-[0_18px_40px_rgb(42_27_18_/_0.14)] ring-1 ring-coffee-600/10 backdrop-blur-md"
          >
            <motion.div
              initial="closed"
              animate="open"
              variants={{
                open: {
                  transition: {
                    staggerChildren: reduceMotion ? 0 : 0.04,
                    delayChildren: reduceMotion ? 0 : 0.02,
                  },
                },
                closed: {},
              }}
              className="flex flex-col"
            >
              {[
                { href: "/settings", label: t("nav.settings") },
                { href: "/shop", label: t("nav.shop") },
                { href: "/menu", label: t("nav.menu") },
              ].map((item) => (
                <motion.div
                  key={item.href}
                  variants={{
                    closed: { opacity: 0, y: -4 },
                    open: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex min-h-[2.8rem] items-center rounded-[1rem] px-3.5 text-sm font-semibold text-coffee-800 transition-colors hover:bg-cream-200/70"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LobbyOpsDashboard({
  onOpenRoast,
  onOpenShowcase,
  onOpenCounter,
  onOpenPuzzle,
}: {
  onOpenRoast: () => void;
  onOpenShowcase: () => void;
  onOpenCounter: () => void;
  onOpenPuzzle: () => void;
}) {
  const tileConfigs: Array<{
    key: "roast" | "showcase" | "counter" | "empty";
    title?: string;
    onClick?: () => void;
    topImageSrc?: string;
    topImageViewportClassName?: string;
    topImageClassName?: string;
    topImageWrapperClassName?: string;
  }> = [
    {
      key: "roast",
      title: t("lobby.sheet.roast.title"),
      onClick: onOpenRoast,
      topImageSrc: publicAssetPath("/images/optimized/ui/lobby-roaster-tile.webp"),
      topImageViewportClassName:
        "h-[6.75rem] w-[6.75rem] overflow-visible sm:h-[7.15rem] sm:w-[7.15rem]",
      topImageClassName: "h-full w-full object-contain",
      topImageWrapperClassName: "top-[0.15rem] sm:top-[0.2rem]",
    },
    {
      key: "showcase",
      title: t("lobby.sheet.showcase.title"),
      onClick: onOpenShowcase,
      topImageSrc: publicAssetPath("/images/optimized/ui/lobby-workbench-tile.webp"),
      topImageViewportClassName:
        "h-[5.25rem] w-[8.75rem] sm:h-[5.55rem] sm:w-[9.2rem]",
      topImageClassName: "h-full w-full object-contain",
      topImageWrapperClassName: "top-[0.8rem] sm:top-[0.9rem]",
    },
    {
      key: "counter",
      title: t("lobby.tile.counter.title"),
      onClick: onOpenCounter,
      topImageSrc: publicAssetPath("/images/optimized/ui/lobby-counter-tile.webp"),
      topImageViewportClassName:
        "h-[5.95rem] w-[8.7rem] sm:h-[6.25rem] sm:w-[9.1rem]",
      topImageClassName: "h-full w-full object-contain",
      topImageWrapperClassName: "top-[0.55rem] sm:top-[0.65rem]",
    },
    {
      key: "empty",
    },
  ];

  return (
    <section className="mb-2">
      <Card className="flex flex-col p-3.5 sm:p-4">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="text-[1.4rem] font-semibold leading-none tracking-[-0.03em] text-coffee-900">
            2048
          </div>
          <p className="text-sm leading-relaxed text-coffee-700/80">
            {t("lobby.card.puzzle.desc")}
          </p>
          <Button
            type="button"
            variant="soft"
            className="h-9 min-h-0 w-full max-w-[9.5rem] shrink-0 text-sm sm:w-[8.5rem]"
            onClick={onOpenPuzzle}
          >
            PLAY
          </Button>
        </div>
      </Card>

      <div
        data-testid="lobby-reference-tile-grid"
        className="mt-5 sm:mt-6"
      >
        <div className="-mx-3 grid grid-cols-2 gap-x-0.5 gap-y-2 sm:mx-0 sm:mx-auto sm:max-w-[26.5rem] sm:gap-x-1.5 sm:gap-y-2.5">
          {tileConfigs.map((tile) => (
            <LobbyWhitePanelTile
              key={tile.key}
              dataTestId={`lobby-reference-tile-${tile.key}`}
              title={tile.title}
              onClick={tile.onClick}
              topImageSrc={tile.topImageSrc}
              topImageViewportClassName={tile.topImageViewportClassName}
              topImageClassName={tile.topImageClassName}
              topImageWrapperClassName={tile.topImageWrapperClassName}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LobbyWhitePanelTile({
  dataTestId,
  title,
  onClick,
  className,
  topImageSrc,
  topImageViewportClassName,
  topImageClassName,
  topImageWrapperClassName,
}: {
  dataTestId?: string;
  title?: string;
  onClick?: () => void;
  className?: string;
  topImageSrc?: string;
  topImageViewportClassName?: string;
  topImageClassName?: string;
  topImageWrapperClassName?: string;
}) {
  const content = (
    <>
      <div className="absolute inset-0">
        <Image
          src={publicAssetPath("/images/optimized/ui/lobby-white-panel-figma.webp")}
          alt=""
          fill
          sizes="(max-width: 640px) 54vw, 320px"
          className="object-contain object-center"
          priority={false}
        />
      </div>
      <div className="relative z-10 flex h-full items-end justify-center px-4 pb-[1.78rem] sm:px-5 sm:pb-[1.88rem]">
        {title ? (
          <div className="w-full text-center text-[13px] font-bold leading-none tracking-[-0.03em] text-[#241811] sm:text-[14px]">
            {title}
          </div>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <div className={cn("relative w-full pt-[1.65rem] sm:pt-[1.8rem]", className)}>
        {topImageSrc ? (
          <div
            className={cn(
              "pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2",
              topImageWrapperClassName,
            )}
          >
            <div className={cn("relative", topImageViewportClassName)}>
              <Image
                src={topImageSrc}
                alt=""
                width={320}
                height={320}
                className={cn(
                  "max-w-none drop-shadow-[0_10px_18px_rgb(90_61_43_/_0.18)]",
                  topImageClassName,
                )}
                priority={false}
              />
            </div>
          </div>
        ) : null}
        <button
          data-testid={dataTestId}
          type="button"
          onClick={onClick}
          className="relative block aspect-[3/2] w-full overflow-hidden rounded-[2rem] text-left transition-transform duration-150 ease-out active:scale-[0.985]"
        >
          {content}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full pt-[1.65rem] sm:pt-[1.8rem]", className)}>
      {topImageSrc ? (
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2",
            topImageWrapperClassName,
          )}
        >
          <div className={cn("relative", topImageViewportClassName)}>
            <Image
              src={topImageSrc}
              alt=""
              width={320}
              height={320}
              className={cn(
                "max-w-none drop-shadow-[0_10px_18px_rgb(90_61_43_/_0.18)]",
                topImageClassName,
              )}
              priority={false}
            />
          </div>
        </div>
      ) : null}
      <div
        data-testid={dataTestId}
        className="relative aspect-[3/2] w-full overflow-hidden rounded-[2rem]"
      >
        {content}
      </div>
    </div>
  );
}
