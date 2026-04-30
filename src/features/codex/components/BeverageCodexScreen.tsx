"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import {
  BEVERAGE_CATEGORY_ORDER,
  BEVERAGE_DEFINITIONS,
} from "@/features/meta/content/beverages";
import { codexStageFor } from "@/features/meta/content/codex";
import { normalizeAccountLevelState } from "@/features/meta/progression/missionEngine";
import type {
  BeverageCategoryId,
  BeverageDefinition,
  CodexEntryStage,
} from "@/features/meta/types/gameState";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";

type DrinkDexCategoryId =
  | "all"
  | "basic"
  | "milk"
  | "sweet"
  | "dessert"
  | "tea"
  | "special";

type DrinkDexFilterId = "all" | "completed" | "undiscovered" | "new" | "favorite";

type DrinkDexItem = {
  beverage: BeverageDefinition;
  id: string;
  name: string;
  categoryLabel: string;
  categoryGroup: DrinkDexCategoryId;
  imageSrc?: string;
  description: string;
  stage: CodexEntryStage;
  isCollected: boolean;
  isDiscovered: boolean;
  isNew: boolean;
  isFavorite: boolean;
  craftCount: number;
  likedByCustomerNames: string[];
  hintText: string;
};

const DRINKDEX_ASSETS = {
  reference: "/assets/drinkdex/reference/drinkdex_final_reference.png",
  background: "/assets/drinkdex/drinkdex_bg_base.png",
  backButton: "/assets/drinkdex/drinkdex_btn_back.png",
  currencyHud: "/assets/drinkdex/drinkdex_hud_currency.png",
  titleBoard: "/assets/drinkdex/drinkdex_title_board.png",
  progressPanel: "/assets/drinkdex/drinkdex_progress_panel.png",
  progressTrack: "/assets/drinkdex/drinkdex_progress_track.png",
  progressFill: "/assets/drinkdex/drinkdex_progress_fill.png",
  categoryTabOn: "/assets/drinkdex/drinkdex_category_tab_on.png",
  categoryTabOff: "/assets/drinkdex/drinkdex_category_tab_off.png",
  filterPillOn: "/assets/drinkdex/drinkdex_filter_pill_on.png",
  filterPillOff: "/assets/drinkdex/drinkdex_filter_pill_off.png",
  cardFrame: "/assets/drinkdex/drinkdex_card_frame.png",
  selectedCardFrame: "/assets/drinkdex/drinkdex_card_frame_selected.png",
  newBadge: "/assets/drinkdex/drinkdex_badge_new.png",
  statusBadge: "/assets/drinkdex/drinkdex_badge_status.png",
  detailPanel: "/assets/drinkdex/drinkdex_detail_panel.png",
  favoriteButton: "/assets/drinkdex/drinkdex_btn_favorite.png",
  workbenchButton: "/assets/drinkdex/drinkdex_btn_workbench.png",
} as const;

const CATEGORY_TABS: Array<{
  id: DrinkDexCategoryId;
  label: string;
  categories: BeverageCategoryId[];
}> = [
  { id: "all", label: "전체", categories: [...BEVERAGE_CATEGORY_ORDER] },
  { id: "basic", label: "기본", categories: ["espressoBasic"] },
  { id: "milk", label: "우유", categories: ["milkCoffee"] },
  { id: "sweet", label: "달콤", categories: ["sweetLatte"] },
  { id: "dessert", label: "디저트", categories: ["mochaDessert"] },
  { id: "tea", label: "티&청량", categories: ["teaLatte", "refreshing"] },
  {
    id: "special",
    label: "스페셜",
    categories: [
      "rareIngredient",
      "timeLimited",
      "signature",
      "legendaryCollection",
    ],
  },
];

const FILTERS: Array<{ id: DrinkDexFilterId; label: string }> = [
  { id: "all", label: "전체" },
  { id: "completed", label: "완성" },
  { id: "undiscovered", label: "미발견" },
  { id: "new", label: "NEW" },
  { id: "favorite", label: "즐겨찾기" },
];

const CATEGORY_LABEL_BY_ID: Record<BeverageCategoryId, string> = {
  espressoBasic: "기본",
  milkCoffee: "우유",
  sweetLatte: "달콤",
  mochaDessert: "디저트",
  teaLatte: "티",
  refreshing: "청량",
  rareIngredient: "희귀",
  timeLimited: "시간한정",
  signature: "시그니처",
  legendaryCollection: "전설",
};

const CATEGORY_GROUP_BY_ID: Record<BeverageCategoryId, DrinkDexCategoryId> = {
  espressoBasic: "basic",
  milkCoffee: "milk",
  sweetLatte: "sweet",
  mochaDessert: "dessert",
  teaLatte: "tea",
  refreshing: "tea",
  rareIngredient: "special",
  timeLimited: "special",
  signature: "special",
  legendaryCollection: "special",
};

const KNOWN_DRINK_IMAGES: Record<string, string> = {
  americano: "/images/optimized/drink/아메리카노.webp",
  latte: "/images/optimized/drink/카페라떼.webp",
  affogato: "/images/optimized/drink/아포가토.webp",
};

const DRINK_NAME_OVERRIDES: Record<string, string> = {
  americano: "아메리카노",
  espresso: "에스프레소",
  doppio: "도피오",
  lungo: "룽고",
  ristretto: "리스트레토",
  cafe_crema: "카페 크레마",
  cold_brew: "콜드브루",
  long_black: "롱 블랙",
  latte: "카페 라떼",
  cappuccino: "카푸치노",
  flat_white: "플랫 화이트",
  cortado: "코르타도",
  cafe_au_lait: "카페 오 레",
  milk_espresso: "밀크 에스프레소",
  oat_latte: "오트 라떼",
  breve_latte: "브레베 라떼",
  affogato: "아포가토",
  mocha: "카페 모카",
  matcha_latte: "말차 라떼",
  royal_milk_tea: "로열 밀크티",
  house_signature: "하우스 시그니처",
  cafe_2048_signature: "카페 2048 시그니처",
};

export function BeverageCodexScreen() {
  useResetDocumentScrollOnMount();

  const [category, setCategory] = useState<DrinkDexCategoryId>("all");
  const [filter, setFilter] = useState<DrinkDexFilterId>("all");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const account = normalizeAccountLevelState(useAppStore((s) => s.accountLevel));
  const codex = useAppStore((s) => s.beverageCodex);
  const playerResources = useAppStore((s) => s.playerResources);

  const drinks = useMemo(
    () =>
      BEVERAGE_DEFINITIONS.map((beverage, index) =>
        adaptDrinkDexItem({
          beverage,
          index,
          stage: codexStageFor({ beverage, account, codex }),
          totalSold: codex.entries[beverage.id]?.totalSold ?? 0,
          favoriteIds,
        }),
      ),
    [account, codex, favoriteIds],
  );

  const totalDrinkCount = Math.max(BEVERAGE_DEFINITIONS.length, 80);
  const collectedCount = drinks.filter((drink) => drink.isCollected).length;
  const progressPercent =
    totalDrinkCount > 0
      ? Math.min(100, Math.round((collectedCount / totalDrinkCount) * 100))
      : 0;

  const filteredDrinks = useMemo(() => {
    const currentTab = CATEGORY_TABS.find((tab) => tab.id === category);
    const categorySet = new Set(currentTab?.categories ?? []);

    return drinks.filter((drink) => {
      const categoryMatch =
        category === "all" || categorySet.has(drink.beverage.categoryId);
      if (!categoryMatch) return false;
      switch (filter) {
        case "completed":
          return drink.isCollected;
        case "undiscovered":
          return !drink.isDiscovered;
        case "new":
          return drink.isNew;
        case "favorite":
          return drink.isFavorite;
        default:
          return true;
      }
    });
  }, [category, drinks, filter]);

  const selectedDrink = useMemo(
    () =>
      drinks.find((drink) => drink.id === selectedId) ??
      filteredDrinks.find((drink) => drink.isDiscovered) ??
      filteredDrinks[0] ??
      drinks[0],
    [drinks, filteredDrinks, selectedId],
  );

  useEffect(() => {
    if (!selectedDrink) return;
    if (!selectedId || !filteredDrinks.some((drink) => drink.id === selectedId)) {
      setSelectedId(selectedDrink.id);
    }
  }, [filteredDrinks, selectedDrink, selectedId]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <DrinkDexBackground>
      <DrinkDexHeader
        coins={playerResources.coins}
        beans={playerResources.beans}
      />

      <main className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-3 pb-[232px] pt-[112px]">
        <DrinkDexTitleBoard />
        <DrinkDexProgressPanel
          collectedCount={collectedCount}
          totalDrinkCount={totalDrinkCount}
          progressPercent={progressPercent}
        />
        <DrinkDexCategoryTabs selected={category} onSelect={setCategory} />

        <section
          className="mt-3 rounded-[28px] border border-[#d9b98b]/70 bg-[#fff7e7]/88 p-2.5 backdrop-blur-sm"
          style={{ boxShadow: "0 18px 36px rgba(96, 61, 32, 0.18)" }}
        >
          <DrinkDexFilterBar
            selected={filter}
            onSelect={setFilter}
            count={filteredDrinks.length}
          />
          <DrinkDexGrid
            drinks={filteredDrinks}
            selectedId={selectedDrink?.id ?? null}
            onSelect={setSelectedId}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      </main>

      {selectedDrink ? (
        <DrinkDexDetailPanel
          drink={selectedDrink}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}
    </DrinkDexBackground>
  );
}

function DrinkDexBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="drinkdex-background min-h-[100dvh] overflow-x-hidden text-coffee-900"
      style={{
        background:
          "linear-gradient(180deg, #f6d9a7 0%, #f9e8c8 32%, #e8c99d 100%)",
      }}
      data-asset-path={DRINKDEX_ASSETS.background}
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-[220px] max-w-md overflow-hidden">
        <div className="absolute -left-10 top-4 h-28 w-28 rounded-full bg-[#fbf0d3]/55 blur-2xl" />
        <div className="absolute right-5 top-12 h-24 w-24 rounded-full bg-[#bd8251]/20 blur-2xl" />
        <div className="absolute inset-x-6 top-0 h-28 rounded-b-[42px] border-x border-b border-[#c18655]/30 bg-[#8c5733]/18" />
      </div>
      {children}
    </div>
  );
}

function DrinkDexHeader({ coins, beans }: { coins: number; beans: number }) {
  return (
    <header className="drinkdex-header fixed inset-x-0 top-0 z-30 mx-auto flex h-[106px] max-w-md items-start justify-between px-4 pt-4">
      <BackButton />
      <DrinkDexCurrencyHud coins={coins} beans={beans} />
    </header>
  );
}

function BackButton() {
  return (
    <Link
      href="/lobby"
      aria-label="로비로 돌아가기"
      className="drinkdex-back-button flex h-12 w-12 items-center justify-center rounded-full border border-[#9a603b]/30 bg-[#fff1ce]/88 text-2xl font-black text-[#6c4328] backdrop-blur-sm active:scale-95"
      style={{ boxShadow: "0 8px 18px rgba(86, 53, 31, 0.22)" }}
      data-asset-path={DRINKDEX_ASSETS.backButton}
    >
      ‹
    </Link>
  );
}

function DrinkDexCurrencyHud({ coins, beans }: { coins: number; beans: number }) {
  return (
    <div
      className="drinkdex-currency-hud flex items-center gap-2 rounded-full border border-[#a96f47]/25 bg-[#fff7e5]/72 px-3 py-2 backdrop-blur-md"
      style={{ boxShadow: "0 10px 24px rgba(83, 51, 27, 0.18)" }}
      data-asset-path={DRINKDEX_ASSETS.currencyHud}
    >
      <CurrencyItem iconSrc="/images/optimized/ui/coin.webp" label="코인" value={coins} />
      <span className="h-5 w-px bg-[#b7835a]/30" />
      <CurrencyItem iconSrc="/images/optimized/ui/bean.webp" label="원두" value={beans} />
    </div>
  );
}

function CurrencyItem({
  iconSrc,
  label,
  value,
}: {
  iconSrc: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${label} ${value}`}>
      <Image
        src={iconSrc}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 object-contain"
      />
      <span className="text-sm font-black tabular-nums text-[#6b432a]">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

function DrinkDexTitleBoard() {
  return (
    <section
      className="drinkdex-title-board mx-auto w-full max-w-[340px] rounded-[30px] border border-[#b37a4c]/30 bg-[#fff1ce]/90 px-5 py-4 text-center"
      style={{ boxShadow: "0 16px 34px rgba(93, 55, 28, 0.18)" }}
      data-asset-path={DRINKDEX_ASSETS.titleBoard}
    >
      <p className="text-xs font-bold text-[#8d603d]/80">
        카페에 기록된 특별한 레시피들
      </p>
      <h1 className="mt-1 text-3xl font-black tracking-normal text-[#5e3a23]">
        음료 도감
      </h1>
    </section>
  );
}

function DrinkDexProgressPanel({
  collectedCount,
  totalDrinkCount,
  progressPercent,
}: {
  collectedCount: number;
  totalDrinkCount: number;
  progressPercent: number;
}) {
  return (
    <section
      className="drinkdex-progress-panel mt-4 rounded-[26px] border border-[#c89a68]/40 bg-[#fff8e9]/86 p-4"
      style={{ boxShadow: "0 12px 26px rgba(90, 55, 30, 0.14)" }}
      data-asset-path={DRINKDEX_ASSETS.progressPanel}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-[#8a5e3d]/72">수집률</p>
          <p className="mt-0.5 text-xl font-black text-[#57351f]">
            {collectedCount} / {totalDrinkCount}
          </p>
        </div>
        <button
          type="button"
          className="h-10 rounded-full border border-[#77a2b9]/35 bg-[#b9d8e5] px-4 text-sm font-black text-[#28506b]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255, 255, 255, 0.58), 0 6px 12px rgba(69, 106, 129, 0.18)",
          }}
        >
          보상 보기
        </button>
      </div>
      <div
        className="drinkdex-progress-track mt-3 h-4 overflow-hidden rounded-full border border-[#b98558]/25 bg-[#ead0a8]"
        data-asset-path={DRINKDEX_ASSETS.progressTrack}
      >
        <div
          className="drinkdex-progress-fill h-full rounded-full bg-[#76b7d2]"
          style={{ width: `${progressPercent}%` }}
          data-asset-path={DRINKDEX_ASSETS.progressFill}
        />
      </div>
      <p className="mt-1 text-right text-xs font-black tabular-nums text-[#6e492d]/75">
        {progressPercent}%
      </p>
    </section>
  );
}

function DrinkDexCategoryTabs({
  selected,
  onSelect,
}: {
  selected: DrinkDexCategoryId;
  onSelect: (id: DrinkDexCategoryId) => void;
}) {
  return (
    <nav className="drinkdex-category-tabs mt-4 flex gap-2 overflow-x-auto pb-1">
      {CATEGORY_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={selected === tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-black shadow-sm transition-colors",
            selected === tab.id
              ? "border-[#6a9ebb]/50 bg-[#9fd0e3] text-[#254c65]"
              : "border-[#c9a06f]/45 bg-[#fff3d5] text-[#775236]",
          )}
          data-asset-path={
            selected === tab.id
              ? DRINKDEX_ASSETS.categoryTabOn
              : DRINKDEX_ASSETS.categoryTabOff
          }
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function DrinkDexFilterBar({
  selected,
  onSelect,
  count,
}: {
  selected: DrinkDexFilterId;
  onSelect: (id: DrinkDexFilterId) => void;
  count: number;
}) {
  return (
    <div className="drinkdex-filter-bar mb-2 flex items-center gap-2">
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={selected === filter.id}
            onClick={() => onSelect(filter.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-black transition-colors",
              selected === filter.id
                ? filter.id === "new"
                  ? "border-[#d88155]/45 bg-[#ffcf9d] text-[#8c3c25]"
                  : "border-[#6a9ebb]/45 bg-[#c2e0ea] text-[#2b556b]"
                : "border-[#cba77a]/38 bg-[#fff8e7] text-[#7b5738]",
            )}
            data-asset-path={
              selected === filter.id
                ? DRINKDEX_ASSETS.filterPillOn
                : DRINKDEX_ASSETS.filterPillOff
            }
          >
            {filter.id === "favorite" ? "★ " : null}
            {filter.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="shrink-0 rounded-full border border-[#cba77a]/45 bg-[#fff8e7] px-3 py-1.5 text-xs font-black text-[#725033]"
        aria-label="기본 정렬"
      >
        기본순 {count}
      </button>
    </div>
  );
}

function DrinkDexGrid({
  drinks,
  selectedId,
  onSelect,
  onToggleFavorite,
}: {
  drinks: DrinkDexItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div className="drinkdex-grid grid grid-cols-3 gap-2.5">
      {drinks.map((drink) => (
        <DrinkDexCard
          key={drink.id}
          drink={drink}
          selected={drink.id === selectedId}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

const DrinkDexCard = memo(function DrinkDexCard({
  drink,
  selected,
  onSelect,
  onToggleFavorite,
}: {
  drink: DrinkDexItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const locked = !drink.isDiscovered;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(drink.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(drink.id);
        }
      }}
      className={cn(
        "drinkdex-card relative min-h-[154px] cursor-pointer overflow-hidden rounded-[22px] border p-2 text-left transition-transform active:scale-[0.98]",
        selected
          ? "border-[#4f9ec2] bg-[#f7fbff] ring-2 ring-[#6eb4d1]"
          : locked
            ? "border-[#d5b991]/55 bg-[#e8d3ae]/74"
            : "border-[#dab98c]/65 bg-[#fff9ea]",
      )}
      style={{ boxShadow: "0 8px 18px rgba(94, 59, 34, 0.14)" }}
      data-asset-path={
        selected ? DRINKDEX_ASSETS.selectedCardFrame : DRINKDEX_ASSETS.cardFrame
      }
    >
      {drink.isNew ? <DrinkDexBadge className="left-1.5 top-1.5">NEW</DrinkDexBadge> : null}
      <DrinkDexFavoriteButton
        active={drink.isFavorite}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(drink.id);
        }}
        className="absolute right-1.5 top-1.5 z-10"
      />
      <div
        className={cn(
          "mx-auto mt-4 flex aspect-square w-[72%] items-center justify-center rounded-full",
          locked ? "bg-[#bda17a]/38" : "bg-[#f4dfbd]/52",
        )}
      >
        <DrinkImage drink={drink} size="card" />
      </div>
      <div className="mt-2 min-h-[42px] text-center">
        <p
          className={cn(
            "line-clamp-2 text-[12px] font-black leading-tight",
            locked ? "text-[#73583d]/60" : "text-[#4d321f]",
          )}
        >
          {locked ? "???" : drink.name}
        </p>
        <p className="mt-1 text-[10px] font-bold text-[#7d5b3d]/72">
          {locked ? `${drink.categoryLabel} 힌트` : statusLabel(drink)}
        </p>
      </div>
    </div>
  );
});

function DrinkDexDetailPanel({
  drink,
  onToggleFavorite,
}: {
  drink: DrinkDexItem;
  onToggleFavorite: (id: string) => void;
}) {
  const locked = !drink.isDiscovered;
  return (
    <aside
      className="drinkdex-detail-panel fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 pb-3"
      data-asset-path={DRINKDEX_ASSETS.detailPanel}
    >
      <div
        className="rounded-t-[34px] border border-[#b98558]/45 bg-[#fff7e4]/96 p-4 backdrop-blur-md"
        style={{ boxShadow: "0 -16px 36px rgba(75, 45, 24, 0.22)" }}
      >
        <div className="flex gap-4">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[28px] border border-[#d1aa79]/45 bg-[#f4dfbd]">
            <DrinkImage drink={drink} size="detail" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-black text-[#8a6040]/70">
                  선택 레시피
                </p>
                <h2 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-[#4d321f]">
                  {locked ? "???" : drink.name}
                </h2>
              </div>
              <DrinkDexFavoriteButton
                active={drink.isFavorite}
                onClick={() => onToggleFavorite(drink.id)}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#c2e0ea] px-2.5 py-1 text-xs font-black text-[#2b556b]">
                {drink.categoryLabel}
              </span>
              <span className="rounded-full bg-[#fff0c9] px-2.5 py-1 text-xs font-black text-[#6e492d]">
                {statusLabel(drink)}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-xs font-bold leading-relaxed text-[#6c4c32]/82">
              {locked ? drink.hintText : drink.description}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black text-[#6e492d]">
          <div className="rounded-2xl bg-[#f0dbb7]/72 px-3 py-2">
            총 제작 수 <span className="tabular-nums">{drink.craftCount}</span>
          </div>
          <div className="rounded-2xl bg-[#f0dbb7]/72 px-3 py-2">
            좋아하는 손님 {drink.likedByCustomerNames.join(", ")}
          </div>
        </div>

        <Link
          href="/lobby/workbench"
          className={cn(
            "mt-3 flex h-12 w-full items-center justify-center rounded-full border text-base font-black",
            locked
              ? "pointer-events-none border-[#c4aa82]/50 bg-[#d9c4a2] text-[#7c664b]/70"
              : "border-[#6a9ebb]/45 bg-[#9fd0e3] text-[#254c65]",
          )}
          style={{ boxShadow: "0 8px 18px rgba(94, 59, 34, 0.16)" }}
          aria-disabled={locked}
          data-asset-path={DRINKDEX_ASSETS.workbenchButton}
        >
          제작대로 이동
        </Link>
      </div>
    </aside>
  );
}

function DrinkDexFavoriteButton({
  active,
  onClick,
  className,
}: {
  active: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={active ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "drinkdex-favorite-button flex h-8 w-8 items-center justify-center rounded-full border border-[#a4744d]/30 bg-[#fff8e8]/90 text-base font-black shadow-sm",
        active ? "text-[#d98b2b]" : "text-[#9d8266]",
        className,
      )}
      data-asset-path={DRINKDEX_ASSETS.favoriteButton}
    >
      ★
    </button>
  );
}

function DrinkDexBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "drinkdex-badge absolute z-10 rounded-full bg-[#ffbd82] px-2 py-0.5 text-[10px] font-black text-[#7a3720] shadow-sm",
        className,
      )}
      data-asset-path={DRINKDEX_ASSETS.newBadge}
    >
      {children}
    </span>
  );
}

function DrinkImage({ drink, size }: { drink: DrinkDexItem; size: "card" | "detail" }) {
  const locked = !drink.isDiscovered;
  const className =
    size === "card"
      ? "h-[82%] w-[82%] object-contain"
      : "h-[86%] w-[86%] object-contain";

  if (locked) {
    return (
      <div className="flex h-[72%] w-[58%] items-center justify-center rounded-b-[42%] rounded-t-[52%] bg-[#7b6048]/38 blur-[0.2px]">
        <span className="text-xl font-black text-[#5c4634]/32">?</span>
      </div>
    );
  }

  if (drink.imageSrc) {
    return (
      <Image
        src={drink.imageSrc}
        alt={drink.name}
        width={size === "card" ? 96 : 128}
        height={size === "card" ? 96 : 128}
        loading="lazy"
        sizes={size === "card" ? "96px" : "128px"}
        className={className}
      />
    );
  }

  return (
    <div className="relative flex h-[74%] w-[66%] items-center justify-center rounded-b-[38%] rounded-t-[48%] border border-[#bd8b5d]/30 bg-[#fff4d9] text-lg font-black text-[#805335]">
      {drink.name.slice(0, 1)}
      <span className="absolute -right-2 top-1/3 h-5 w-4 rounded-r-full border-y border-r border-[#bd8b5d]/28" />
    </div>
  );
}

function adaptDrinkDexItem({
  beverage,
  index,
  stage,
  totalSold,
  favoriteIds,
}: {
  beverage: BeverageDefinition;
  index: number;
  stage: CodexEntryStage;
  totalSold: number;
  favoriteIds: Set<string>;
}): DrinkDexItem {
  const isCollected = stage === "crafted" || stage === "sold";
  const isDiscovered = stage !== "locked";
  const categoryLabel = CATEGORY_LABEL_BY_ID[beverage.categoryId];
  const categoryGroup = CATEGORY_GROUP_BY_ID[beverage.categoryId];
  const name = safeDrinkName(beverage);

  return {
    beverage,
    id: beverage.id,
    name,
    categoryLabel,
    categoryGroup,
    imageSrc:
      KNOWN_DRINK_IMAGES[beverage.id] ??
      (beverage.recipeId ? KNOWN_DRINK_IMAGES[beverage.recipeId] : undefined),
    description: safeDescription(beverage, categoryLabel),
    stage,
    isCollected,
    isDiscovered,
    isNew: isDiscovered && index < 6 && !isCollected,
    isFavorite: favoriteIds.has(beverage.id),
    craftCount: Math.max(totalSold, isCollected ? 1 : 0),
    likedByCustomerNames: likedByFor(beverage.id),
    hintText: `${categoryLabel} 계열의 레시피입니다. Lv.${beverage.unlockLevel} 이후 단서가 더 선명해져요.`,
  };
}

function safeDrinkName(beverage: BeverageDefinition): string {
  if (DRINK_NAME_OVERRIDES[beverage.id]) return DRINK_NAME_OVERRIDES[beverage.id];
  return beverage.id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function safeDescription(
  beverage: BeverageDefinition,
  categoryLabel: string,
): string {
  if (beverage.id === "americano") {
    return "깔끔한 커피 향과 부드러운 물의 균형이 좋은 기본 레시피입니다.";
  }
  if (beverage.id === "latte") {
    return "에스프레소와 우유가 만나 포근하게 마무리되는 카페의 대표 메뉴입니다.";
  }
  if (beverage.id === "affogato") {
    return "차가운 디저트 위에 진한 커피를 얹은 달콤한 특별 메뉴입니다.";
  }
  return `${categoryLabel} 카테고리에 기록된 특별한 레시피입니다. 제작과 판매 기록이 쌓이면 더 많은 이야기가 열립니다.`;
}

function likedByFor(beverageId: string): string[] {
  if (beverageId === "americano") return ["조용한 손님"];
  if (beverageId === "latte") return ["단골 손님"];
  if (beverageId === "affogato") return ["디저트 손님"];
  return ["기록 대기"];
}

function statusLabel(drink: DrinkDexItem): string {
  if (!drink.isDiscovered) return "???";
  if (drink.isCollected) return "수집 완료";
  if (drink.stage === "purchased") return "제작 대기";
  return "발견!";
}
