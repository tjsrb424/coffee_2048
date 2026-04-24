"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Suspense,
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/Button";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import type { LobbySheetId } from "@/features/lobby/config/lobbyHotspots";
import {
  LOBBY_SHEET_DESCRIPTION_ID,
  LOBBY_SHEET_TAGLINE_ID,
  LOBBY_SHEET_TITLE_ID,
} from "@/features/lobby/config/lobbySheetCopy";
import { buildLobbySheetSummary } from "@/features/lobby/lib/lobbySheetSummary";
import { totalMenuStock } from "@/features/meta/balance/cafeEconomy";
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
import { CafeShopSection } from "./CafeShopSection";
import { LobbyBottomSheet } from "./LobbyBottomSheet";
import { RoasterSheetTopOverlap } from "./RoasterSheetTopOverlap";
import { WorkbenchSheetTopOverlap } from "./WorkbenchSheetTopOverlap";
import { CounterSheetTopOverlap } from "./CounterSheetTopOverlap";
import { CounterSellPulseToast } from "./CounterSellPulseToast";
import { OfflineSalesCard } from "./OfflineSalesCard";
import { CounterSheetTodayGuestHint } from "@/features/customers/components/CustomerPresenceHints";
import { ResourceBar } from "./ResourceBar";
import { LobbyPanelQuerySync } from "./LobbyPanelQuerySync";
import { AccountLevelCard } from "./AccountLevelCard";

const LOBBY_BG_ASSET = publicAssetPath("/assets/lobby/lobby_bg_base.png");
const LOBBY_TITLE_LOGO_ASSET = publicAssetPath("/assets/lobby/lobby_title_logo.png");
const LOBBY_MENU_BUTTON_ASSET = publicAssetPath("/assets/lobby/lobby_btn_menu.png");
const LOBBY_PLAY_BUTTON_ASSET = publicAssetPath("/assets/lobby/lobby_btn_play.png");
const LOBBY_TILE_FRAME_ASSET = publicAssetPath("/assets/lobby/lobby_hud_ui.png");
const LOBBY_ROASTER_TILE_ASSET = publicAssetPath("/assets/lobby/lobby_btn_roaster.png");
const LOBBY_DRINK_TILE_ASSET = publicAssetPath("/assets/lobby/lobby_btn_drinkstation.png");
const LOBBY_CASHIER_TILE_ASSET = publicAssetPath("/assets/lobby/lobby_btn_cashier.png");
const LOBBY_SHOP_TILE_ASSET = publicAssetPath("/assets/lobby/lobby_btn_shop.png");
const LOBBY_REFERENCE_OVERLAY_ASSET = publicAssetPath("/mock/lobby_reference.png");
const LOBBY_OVERLAY_STORAGE_KEY = "coffee2048_lobby_overlay" as const;

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
  const [showLobbyOverlay, setShowLobbyOverlay] = useState(false);
  const canUseOverlayToggle = process.env.NODE_ENV !== "production";

  useEffect(() => {
    router.prefetch("/puzzle");
  }, [router]);

  useEffect(() => {
    if (!canUseOverlayToggle || typeof window === "undefined") return;
    try {
      const search = new URLSearchParams(window.location.search);
      const queryEnabled = search.get("lobby_overlay") === "1";
      const storedEnabled =
        window.localStorage.getItem(LOBBY_OVERLAY_STORAGE_KEY) === "1";
      setShowLobbyOverlay(queryEnabled || storedEnabled);
    } catch {
      setShowLobbyOverlay(false);
    }
  }, [canUseOverlayToggle]);

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
  const toggleLobbyOverlay = useCallback(() => {
    if (!canUseOverlayToggle || typeof window === "undefined") return;
    setShowLobbyOverlay((current) => {
      const next = !current;
      try {
        if (next) {
          window.localStorage.setItem(LOBBY_OVERLAY_STORAGE_KEY, "1");
        } else {
          window.localStorage.removeItem(LOBBY_OVERLAY_STORAGE_KEY);
        }
      } catch {
        // Overlay debug state should never affect lobby behavior.
      }
      return next;
    });
  }, [canUseOverlayToggle]);

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
    () => totalMenuStock(cafeState.menuStock),
    [cafeState.menuStock],
  );

  return (
    <>
      <Suspense fallback={null}>
        <LobbyPanelQuerySync onCafePanelFromQuery={openCafeFromQuery} />
      </Suspense>
      <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#d9efff]">
        <main className="relative mx-auto h-[100dvh] w-full max-w-md overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src={LOBBY_BG_ASSET}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 28rem"
              className="object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(180deg, rgba(255, 251, 244, 0.12) 0%, rgba(255, 248, 240, 0.05) 42%, rgba(255, 247, 237, 0.18) 100%)",
              }}
            />
          </div>

          {showLobbyOverlay ? (
            <div className="pointer-events-none absolute inset-0 z-[60] opacity-30">
              <Image
                src={LOBBY_REFERENCE_OVERLAY_ASSET}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 28rem"
                className="object-cover object-center"
              />
            </div>
          ) : null}

          <div
            className="absolute left-[4.2%] z-40"
            style={{ top: "calc(env(safe-area-inset-top) + 0.9rem)" }}
          >
            <AccountLevelCard />
          </div>
          <div
            className="absolute right-[4.8%] z-40"
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
          >
            <LobbyTopMenu
              open={menuOpen}
              onToggle={() => setMenuOpen((v) => !v)}
              onClose={closeMenu}
              reduceMotion={reduceMotion}
            />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-[4.15%] z-30 w-[57.5%] -translate-x-1/2">
            <div className="relative aspect-[497/304] w-full">
              <Image
                src={LOBBY_TITLE_LOGO_ASSET}
                alt="Coffee 2048"
                fill
                priority
                sizes="(max-width: 768px) 58vw, 16rem"
                className="object-contain object-center drop-shadow-[0_10px_24px_rgb(76_53_37_/_0.18)]"
              />
            </div>
          </div>
          <h1 className="sr-only">{t("lobby.srOnly.todayShop")}</h1>

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
            onOpenShop={() => {
              openSheet("shop");
            }}
            onOpenPuzzle={() => {
              if (!consumeHeart()) return;
              window.dispatchEvent(
                new CustomEvent("coffee:request-bgm-fadeout", { detail: { ms: 1200 } }),
              );
              runSceneTransition(() => router.push("/puzzle"), "/puzzle");
            }}
          />

          <div
            className="absolute left-1/2 z-40 flex w-[88%] max-w-[23rem] -translate-x-1/2 flex-col gap-2"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.9rem)" }}
          >
            {!lobbyOnboardingSeen ? (
              <div className="flex items-start gap-2 rounded-2xl bg-cream-50/80 px-3 py-2 ring-1 ring-accent-soft/20 backdrop-blur-[3px]">
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

            <OfflineSalesCard className="mb-0" />
          </div>

          <div
            className="absolute left-1/2 z-30 w-[66%] -translate-x-1/2"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.95rem)" }}
          >
            <ResourceBar variant="compact" className="!mb-0 max-w-none" />
          </div>

          {canUseOverlayToggle ? (
            <button
              type="button"
              onClick={toggleLobbyOverlay}
              className="absolute left-3 z-[70] rounded-full bg-coffee-950/70 px-3 py-1.5 text-[11px] font-semibold text-cream-50 shadow-md backdrop-blur"
              style={{ top: "calc(env(safe-area-inset-top) + 5rem)" }}
            >
              {showLobbyOverlay ? "Overlay On" : "Overlay Off"}
            </button>
          ) : null}
        </main>
      </div>

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
          </>
        )}
        {open?.sheet === "shop" && <CafeShopSection />}
        {open &&
        open.sheet !== "puzzle" &&
        open.sheet !== "roast" &&
        open.sheet !== "shop" ? (
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
        className={cn(
          "relative flex h-[3.35rem] w-[3.35rem] items-center justify-center overflow-hidden rounded-[1.15rem] transition-transform duration-150 ease-out active:scale-95",
          open && "scale-[0.98]",
        )}
      >
        <Image
          src={LOBBY_MENU_BUTTON_ASSET}
          alt=""
          fill
          sizes="3.35rem"
          className="object-contain"
          priority
        />
        <span
          className={cn(
            "absolute inset-0 rounded-[1.15rem] ring-2 ring-transparent transition-colors",
            open && "ring-[#84aee8]/45",
          )}
          aria-hidden
        />
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
                { href: "/codex", label: t("nav.codex") },
                { href: "/time-shop", label: t("nav.timeShop") },
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
  onOpenShop,
  onOpenPuzzle,
}: {
  onOpenRoast: () => void;
  onOpenShowcase: () => void;
  onOpenCounter: () => void;
  onOpenShop: () => void;
  onOpenPuzzle: () => void;
}) {
  const tileConfigs: Array<{
    key: "roast" | "showcase" | "counter" | "shop";
    title: string;
    onClick: () => void;
    imageSrc: string;
    style: CSSProperties;
  }> = [
    {
      key: "roast",
      title: t("lobby.sheet.roast.title"),
      onClick: onOpenRoast,
      imageSrc: LOBBY_ROASTER_TILE_ASSET,
      style: { left: "4.45%", top: "16.1%", width: "43.65%" },
    },
    {
      key: "showcase",
      title: t("lobby.sheet.showcase.title"),
      onClick: onOpenShowcase,
      imageSrc: LOBBY_DRINK_TILE_ASSET,
      style: { right: "4.45%", top: "16.1%", width: "43.65%" },
    },
    {
      key: "counter",
      title: t("lobby.tile.counter.title"),
      onClick: onOpenCounter,
      imageSrc: LOBBY_CASHIER_TILE_ASSET,
      style: { left: "4.45%", top: "48.35%", width: "43.65%" },
    },
    {
      key: "shop",
      title: t("lobby.tile.shop.title"),
      onClick: onOpenShop,
      imageSrc: LOBBY_SHOP_TILE_ASSET,
      style: { right: "4.45%", top: "48.35%", width: "43.65%" },
    },
  ];

  return (
    <section>
      <div
        data-testid="lobby-reference-tile-grid"
        className="absolute left-1/2 top-[16.45%] z-20 w-[97%] -translate-x-1/2"
      >
        <div className="relative mx-auto aspect-[824/1017] w-full">
          <Image
            src={LOBBY_TILE_FRAME_ASSET}
            alt=""
            fill
            sizes="(max-width: 768px) 97vw, 27rem"
            className="object-contain drop-shadow-[0_20px_45px_rgb(82_58_43_/_0.18)]"
            priority
          />
          {tileConfigs.map((tile) => (
            <LobbyGraphicTile
              key={tile.key}
              dataTestId={`lobby-reference-tile-${tile.key}`}
              title={tile.title}
              imageSrc={tile.imageSrc}
              onClick={tile.onClick}
              style={tile.style}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label="PLAY"
        onClick={onOpenPuzzle}
        className="absolute left-1/2 top-[75.8%] z-30 block w-[66%] -translate-x-1/2 transition-transform duration-150 ease-out active:scale-[0.985]"
      >
        <span className="sr-only">PLAY</span>
        <div className="relative aspect-[738/260] w-full">
          <Image
            src={LOBBY_PLAY_BUTTON_ASSET}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 66vw, 18rem"
            className="object-contain drop-shadow-[0_14px_28px_rgb(91_69_47_/_0.22)]"
          />
        </div>
      </button>
    </section>
  );
}

function LobbyGraphicTile({
  dataTestId,
  title,
  onClick,
  className,
  imageSrc,
  style,
}: {
  dataTestId?: string;
  title: string;
  onClick?: () => void;
  className?: string;
  imageSrc: string;
  style?: CSSProperties;
}) {
  const content = (
    <div className="relative aspect-[412/593] w-full">
      <Image
        src={imageSrc}
        alt=""
        fill
        sizes="(max-width: 768px) 42vw, 12rem"
        className="object-contain object-center"
        priority={false}
      />
    </div>
  );

  if (onClick) {
    return (
      <button
        data-testid={dataTestId}
        type="button"
        aria-label={title}
        onClick={onClick}
        className={cn(
          "absolute block overflow-visible text-left transition-transform duration-150 ease-out active:scale-[0.985]",
          className,
        )}
        style={style}
      >
        {content}
        <span className="sr-only">{title}</span>
      </button>
    );
  }

  return (
    <div
      data-testid={dataTestId}
      className={cn("absolute overflow-visible", className)}
      style={style}
    >
      {content}
    </div>
  );
}
