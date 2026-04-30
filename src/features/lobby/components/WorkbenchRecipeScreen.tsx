"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { DrinkMenuId } from "@/features/meta/types/gameState";
import {
  WORKBENCH_LAYOUT_BASE,
  workbenchLayout,
  mergeWorkbenchLayoutPatch,
  type WorkbenchLayout,
  type WorkbenchLayoutItem,
  type WorkbenchLayoutKey,
} from "@/features/lobby/config/workbenchLayout";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { publicAssetPath } from "@/lib/publicAssetPath";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/useAppStore";
import { WorkbenchTuningPanel } from "./WorkbenchTuningPanel";

type RecipeCategory =
  | "all"
  | "base"
  | "milk"
  | "sweet"
  | "dessert"
  | "tea"
  | "special";

type MaterialPreview = {
  name: string;
  have: number;
  need: number;
  icon: string;
};

type WorkbenchRecipe = {
  id: string;
  name: string;
  category: Exclude<RecipeCategory, "all">;
  tag: string;
  description: string;
  stockReady: boolean;
  isNew?: boolean;
  isFavorite?: boolean;
  craftId?: DrinkMenuId;
  imageSrc: string;
  materials: MaterialPreview[];
};

const ASSET_BASE = "/assets/drinkstation" as const;
const WORKBENCH_TUNING_LAYOUT_STORAGE_KEY =
  "coffee2048_workbench_tuning_layout" as const;
const RECIPE_GRID_LAYOUT_BASE = { width: 910, height: 1094 } as const;
const CARD_LAYOUT_BASE = { width: 409, height: 341 } as const;
const MATERIAL_TILE_LAYOUT_BASE = { width: 62, height: 109 } as const;
const BOTTOM_PANEL_LAYOUT_BASE = { width: 942, height: 420 } as const;
const BOTTOM_CRAFT_BUTTON_LAYOUT_BASE = { width: 300, height: 78 } as const;

const stationAssets = {
  bgBase: `${ASSET_BASE}/drinkstation_bg_base.png`,
  topHud: `${ASSET_BASE}/drinkstation_hud_top.png`,
  title: `${ASSET_BASE}/drinkstation_title.png`,
  backButton: `${ASSET_BASE}/drinkstation_btn_ back.png`,
  cardPanel: `${ASSET_BASE}/drinkstation_bg_card.png`,
  cardBase: `${ASSET_BASE}/drinkstation_card_base.png`,
  materialCard: `${ASSET_BASE}/drinkstation_card_material.png`,
  cardButton: `${ASSET_BASE}/drinkstation_card_btn.png`,
  shortageBadge: `${ASSET_BASE}/drinkstation_card_ shortage.png`,
  newBadge: `${ASSET_BASE}/drinkstation_hud_ new.png`,
  possibleBadge: `${ASSET_BASE}/drinkstation_hud_ possible.png`,
  bottomSelectBg: `${ASSET_BASE}/drinkstation_bottom_select_bg.png`,
  bottomHud: `${ASSET_BASE}/drinkstation_botttom_hud.png`,
  productionButton: `${ASSET_BASE}/drinkstation_btn_ bottom_ production.png`,
  toggleOn: `${ASSET_BASE}/drinkstation_btn_toggle_on.png`,
  toggleOff: `${ASSET_BASE}/drinkstation_btn_toggle_off.png`,
} as const;

const categoryAssetNames: Record<
  RecipeCategory,
  { on: string; off: string }
> = {
  all: {
    on: "drinkstation_btn_ type_all_on.png",
    off: "drinkstation_btn_ type_all_off.png",
  },
  base: {
    on: "drinkstation_btn_ type_basic_on.png",
    off: "drinkstation_btn_ type_basic_off.png",
  },
  milk: {
    on: "drinkstation_btn_ type_milk_on.png",
    off: "drinkstation_btn_ type_milk_off.png",
  },
  sweet: {
    on: "drinkstation_btn_ type_sweet_on.png",
    off: "drinkstation_btn_ type_sweet_off.png",
  },
  dessert: {
    on: "drinkstation_btn_ type_dessert_on.png",
    off: "drinkstation_btn_ type_dessert_off.png",
  },
  tea: {
    on: "drinkstation_btn_ type_tea_on.png",
    off: "drinkstation_btn_ type_tea_off.png",
  },
  special: {
    on: "drinkstation_btn_ type_special_on.png",
    off: "drinkstation_btn_ type_special_off.png",
  },
};

const categories: Array<{ key: RecipeCategory; label: string }> = [
  { key: "all", label: "전체" },
  { key: "base", label: "기본" },
  { key: "milk", label: "우유" },
  { key: "sweet", label: "달콤" },
  { key: "dessert", label: "디저트" },
  { key: "tea", label: "티&청량" },
  { key: "special", label: "스페셜" },
];

const drinkImages = {
  americano: "/images/optimized/drink/아메리카노.webp",
  latte: "/images/optimized/drink/카페라떼.webp",
  affogato: "/images/optimized/drink/아포가토.webp",
} as const;

const recipes: WorkbenchRecipe[] = [
  {
    id: "americano",
    name: "아메리카노",
    category: "base",
    tag: "기본",
    description: "깔끔한 에스프레소와 물의 산뜻한 균형.",
    stockReady: true,
    craftId: "americano",
    imageSrc: drinkImages.americano,
    materials: [
      { name: "원두", have: 12, need: 1, icon: "☕" },
      { name: "물", have: 24, need: 1, icon: "💧" },
    ],
  },
  {
    id: "latte",
    name: "카페 라떼",
    category: "milk",
    tag: "우유",
    description: "부드러운 우유와 에스프레소의 완벽한 밸런스.",
    stockReady: true,
    isFavorite: true,
    craftId: "latte",
    imageSrc: drinkImages.latte,
    materials: [
      { name: "원두", have: 12, need: 1, icon: "☕" },
      { name: "우유", have: 18, need: 1, icon: "🥛" },
    ],
  },
  {
    id: "vanilla-latte",
    name: "바닐라 라떼",
    category: "sweet",
    tag: "달콤",
    description: "바닐라 향을 얹은 포근한 라떼 레시피.",
    stockReady: true,
    isNew: true,
    imageSrc: drinkImages.affogato,
    materials: [
      { name: "원두", have: 12, need: 1, icon: "☕" },
      { name: "우유", have: 18, need: 1, icon: "🥛" },
      { name: "시럽", have: 6, need: 1, icon: "🍯" },
    ],
  },
  {
    id: "cafe-mocha",
    name: "카페 모카",
    category: "sweet",
    tag: "달콤",
    description: "초콜릿과 커피가 만나는 진한 디저트 음료.",
    stockReady: false,
    imageSrc: drinkImages.affogato,
    materials: [
      { name: "원두", have: 12, need: 1, icon: "☕" },
      { name: "우유", have: 18, need: 1, icon: "🥛" },
      { name: "초콜릿", have: 0, need: 1, icon: "🍫" },
    ],
  },
  {
    id: "matcha-latte",
    name: "말차 라떼",
    category: "tea",
    tag: "티&청량",
    description: "쌉싸름한 말차와 우유가 차분하게 어우러져요.",
    stockReady: true,
    imageSrc: drinkImages.latte,
    materials: [
      { name: "말차", have: 5, need: 1, icon: "🍵" },
      { name: "우유", have: 18, need: 1, icon: "🥛" },
      { name: "물", have: 24, need: 1, icon: "💧" },
    ],
  },
  {
    id: "nutty-cloud",
    name: "너티 클라우드",
    category: "special",
    tag: "스페셜",
    description: "고소한 견과 향과 크림이 올라간 특별 메뉴.",
    stockReady: false,
    imageSrc: drinkImages.affogato,
    materials: [
      { name: "원두", have: 12, need: 1, icon: "☕" },
      { name: "우유", have: 18, need: 1, icon: "🥛" },
      { name: "시럽", have: 0, need: 1, icon: "🍯" },
    ],
  },
];

function stationAsset(path: string) {
  return publicAssetPath(path);
}

function categoryAssetPath(category: RecipeCategory, active: boolean): string {
  const name = active
    ? categoryAssetNames[category].on
    : categoryAssetNames[category].off;
  return stationAsset(`${ASSET_BASE}/${name}`);
}

function isLocalhostDevHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

function parseStoredLayout(): WorkbenchLayout {
  if (typeof window === "undefined") return workbenchLayout;
  try {
    const stored = window.localStorage.getItem(WORKBENCH_TUNING_LAYOUT_STORAGE_KEY);
    return stored
      ? mergeWorkbenchLayoutPatch(workbenchLayout, JSON.parse(stored))
      : workbenchLayout;
  } catch {
    return workbenchLayout;
  }
}

function persistTunedLayout(layout: WorkbenchLayout) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      WORKBENCH_TUNING_LAYOUT_STORAGE_KEY,
      JSON.stringify(layout),
    );
  } catch {
    // dev-only tuning
  }
}

function layoutItemStyle(
  item: WorkbenchLayoutItem,
  anchor: "top" | "bottom" = "top",
): CSSProperties {
  const fixedUnit = "min(100vw, 430px)";
  const topOrBottom =
    anchor === "bottom"
      ? {
          bottom: `calc(${fixedUnit} * ${
            (WORKBENCH_LAYOUT_BASE.height - item.y - item.height) /
            WORKBENCH_LAYOUT_BASE.width
          })`,
        }
      : {
          top: `calc(${fixedUnit} * ${
            item.y / WORKBENCH_LAYOUT_BASE.width
          })`,
        };

  return {
    left: `${(item.x / WORKBENCH_LAYOUT_BASE.width) * 100}%`,
    ...topOrBottom,
    width: `${(item.width / WORKBENCH_LAYOUT_BASE.width) * 100}%`,
    height: `calc(${fixedUnit} * ${item.height / WORKBENCH_LAYOUT_BASE.width})`,
    transform: `scale(${item.scale})`,
    transformOrigin: "top left",
    zIndex: item.zIndex,
    opacity: item.opacity ?? 1,
  };
}

function localLayoutItemStyle(
  item: WorkbenchLayoutItem,
  base: { width: number; height: number },
): CSSProperties {
  return {
    left: `${(item.x / base.width) * 100}%`,
    top: `${(item.y / base.height) * 100}%`,
    width: `${(item.width / base.width) * 100}%`,
    height: `${(item.height / base.height) * 100}%`,
    transform: `scale(${item.scale})`,
    transformOrigin: "top left",
    zIndex: item.zIndex,
    opacity: item.opacity ?? 1,
  };
}

export function WorkbenchRecipeScreen() {
  useResetDocumentScrollOnMount();

  const shots = useAppStore((s) => s.cafeState.espressoShots);
  const craftDrink = useAppStore((s) => s.craftDrink);
  const [selectedCategory, setSelectedCategory] =
    useState<RecipeCategory>("all");
  const [craftableOnly, setCraftableOnly] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState(
    recipes.find((recipe) => recipe.stockReady)?.id ?? recipes[0].id,
  );
  const [craftCount, setCraftCount] = useState(1);

  const isNonProductionBuild = process.env.NODE_ENV !== "production";
  const [canUseWorkbenchDevTools, setCanUseWorkbenchDevTools] =
    useState(isNonProductionBuild);
  const [showTuningPanel, setShowTuningPanel] = useState(false);
  const [tunedLayout, setTunedLayout] =
    useState<WorkbenchLayout>(workbenchLayout);
  const [selectedLayoutKey, setSelectedLayoutKey] =
    useState<WorkbenchLayoutKey>("recipeGrid");

  useEffect(() => {
    if (isNonProductionBuild) return;
    setCanUseWorkbenchDevTools(isLocalhostDevHost());
  }, [isNonProductionBuild]);

  useEffect(() => {
    if (!canUseWorkbenchDevTools) return;
    setTunedLayout(parseStoredLayout());
  }, [canUseWorkbenchDevTools]);

  const changeLayoutItem = useCallback(
    (key: WorkbenchLayoutKey, patch: Partial<WorkbenchLayoutItem>) => {
      if (!canUseWorkbenchDevTools) return;
      setTunedLayout((current) => {
        const next = {
          ...current,
          [key]: { ...current[key], ...patch },
        };
        persistTunedLayout(next);
        return next;
      });
    },
    [canUseWorkbenchDevTools],
  );

  const resetTunedLayout = useCallback(() => {
    setTunedLayout(workbenchLayout);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(WORKBENCH_TUNING_LAYOUT_STORAGE_KEY);
    } catch {
      // dev-only tuning
    }
  }, []);

  useEffect(() => {
    if (!canUseWorkbenchDevTools) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const direction =
        event.key === "ArrowLeft"
          ? { x: -1, y: 0 }
          : event.key === "ArrowRight"
            ? { x: 1, y: 0 }
            : event.key === "ArrowUp"
              ? { x: 0, y: -1 }
              : event.key === "ArrowDown"
                ? { x: 0, y: 1 }
                : null;
      if (!direction) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "select" ||
        tagName === "textarea" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      changeLayoutItem(selectedLayoutKey, {
        x: tunedLayout[selectedLayoutKey].x + direction.x * step,
        y: tunedLayout[selectedLayoutKey].y + direction.y * step,
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canUseWorkbenchDevTools, changeLayoutItem, selectedLayoutKey, tunedLayout]);

  const visibleRecipes = useMemo(
    () =>
      recipes.filter((recipe) => {
        const categoryMatches =
          selectedCategory === "all" || recipe.category === selectedCategory;
        const craftableMatches = !craftableOnly || recipe.stockReady;
        return categoryMatches && craftableMatches;
      }),
    [craftableOnly, selectedCategory],
  );

  useEffect(() => {
    if (!visibleRecipes.some((recipe) => recipe.id === selectedRecipeId)) {
      setSelectedRecipeId(visibleRecipes[0]?.id ?? recipes[0].id);
    }
  }, [selectedRecipeId, visibleRecipes]);

  const selectedRecipe =
    recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0];

  const craftSelectedRecipe = () => {
    if (!selectedRecipe.stockReady) return;
    if (selectedRecipe.craftId) {
      const didCraft = craftDrink(selectedRecipe.craftId);
      if (!didCraft) return;
    }
    setCraftCount(1);
  };

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#b9d5ee]">
      <main
        className="relative mx-auto h-[100dvh] w-full max-w-[430px] overflow-hidden bg-[#f6ead9]"
        style={{
          backgroundImage: `url("${stationAsset(stationAssets.bgBase)}")`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <WorkbenchLayoutSlot item={tunedLayout.topHud}>
          <Image
            src={stationAsset(stationAssets.topHud)}
            alt=""
            width={885}
            height={350}
            className="h-auto w-full object-contain"
            priority
          />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.backButton}>
          <Link
            href="/lobby"
            aria-label="로비로 돌아가기"
            className="grid h-full w-full place-items-center transition-transform active:scale-[0.97]"
          >
            <Image
              src={stationAsset(stationAssets.backButton)}
              alt=""
              width={93}
              height={84}
              className="h-full w-auto object-contain drop-shadow-[0_4px_0_rgb(47_115_185_/_0.25)]"
              priority
            />
          </Link>
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.title}>
          <Image
            src={stationAsset(stationAssets.title)}
            alt="음료 제작대"
            width={365}
            height={102}
            className="h-auto w-full object-contain"
            priority
          />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.shotHud}>
          <ShotHud shots={shots} />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.categoryTabs}>
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.recipeGrid}>
          <RecipeGrid
            recipes={visibleRecipes}
            selectedRecipeId={selectedRecipeId}
            onSelectRecipe={setSelectedRecipeId}
            layout={tunedLayout}
            craftableOnly={craftableOnly}
            onToggleCraftable={() => setCraftableOnly((value) => !value)}
          />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.bottomHud} anchor="bottom">
          <Image
            src={stationAsset(stationAssets.bottomHud)}
            alt=""
            width={885}
            height={321}
            className="pointer-events-none h-auto w-full object-contain"
          />
        </WorkbenchLayoutSlot>

        <WorkbenchLayoutSlot item={tunedLayout.bottomPanel} anchor="bottom">
          <SelectedRecipePanel
            recipe={selectedRecipe}
            craftCount={craftCount}
            onDec={() => setCraftCount((value) => Math.max(1, value - 1))}
            onInc={() => setCraftCount((value) => Math.min(99, value + 1))}
            onCraft={craftSelectedRecipe}
            layout={tunedLayout}
          />
        </WorkbenchLayoutSlot>

        {canUseWorkbenchDevTools ? (
          <button
            data-visual-test-hidden="true"
            type="button"
            onClick={() => setShowTuningPanel((value) => !value)}
            className="absolute right-3 top-3 z-[120] rounded-full bg-coffee-950/70 px-3 py-1.5 text-[11px] font-semibold text-cream-50 shadow-md backdrop-blur"
          >
            {showTuningPanel ? "Tune Off" : "Tune On"}
          </button>
        ) : null}
      </main>

      {canUseWorkbenchDevTools && showTuningPanel ? (
        <WorkbenchTuningPanel
          layout={tunedLayout}
          selectedKey={selectedLayoutKey}
          onSelectedKeyChange={setSelectedLayoutKey}
          onLayoutItemChange={changeLayoutItem}
          onResetLayout={resetTunedLayout}
        />
      ) : null}
    </div>
  );
}

function ShotHud({ shots }: { shots: number }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center gap-3 rounded-full border border-white/35 bg-[#fff7ea]/42 px-3 backdrop-blur-md"
      style={{
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.65), 0 4px 10px rgb(84 53 30 / 0.12)",
      }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#f8ead6]/80 text-[20px] shadow-inner ring-1 ring-[#c79b6d]/25">
        ☕
      </span>
      <span className="text-[20px] font-black tabular-nums text-[#6a482d] drop-shadow-[0_1px_0_rgb(255_255_255_/_0.7)]">
        {shots.toLocaleString()}
      </span>
    </div>
  );
}

function CategoryTabs({
  selectedCategory,
  onSelect,
}: {
  selectedCategory: RecipeCategory;
  onSelect: (category: RecipeCategory) => void;
}) {
  return (
    <div className="flex h-full items-end justify-between gap-1">
      {categories.map((category) => {
        const active = selectedCategory === category.key;
        return (
          <button
            key={category.key}
            type="button"
            aria-label={`${category.label} 카테고리`}
            aria-pressed={active}
            className="grid min-w-0 flex-1 place-items-center transition-transform active:scale-[0.97]"
            onClick={() => onSelect(category.key)}
          >
            <Image
              src={categoryAssetPath(category.key, active)}
              alt=""
              width={114}
              height={109}
              className="h-auto w-full max-w-[58px] object-contain drop-shadow-[0_3px_5px_rgb(71_42_24_/_0.15)]"
              priority={category.key === "all"}
            />
            <span className="sr-only">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function FilterBar({
  craftableOnly,
  onToggleCraftable,
}: {
  craftableOnly: boolean;
  onToggleCraftable: () => void;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-1.5 rounded-[1.25rem] border border-[#e4c8a2]/60 bg-[#fff9ee]/94 px-2 shadow-[0_2px_8px_rgb(90_61_43_/_0.06)]">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          aria-label="제작 가능 필터"
          aria-pressed={craftableOnly}
          className="relative shrink-0 transition-transform active:scale-[0.97]"
          onClick={onToggleCraftable}
        >
          <Image
            src={stationAsset(
              craftableOnly ? stationAssets.toggleOn : stationAssets.toggleOff,
            )}
            alt=""
            width={159}
            height={55}
            className="h-auto w-[78px] object-contain min-[390px]:w-[92px]"
          />
          <span
            className={cn(
              "absolute inset-0 grid place-items-center pl-4 text-[11px] font-black leading-none min-[390px]:text-[12px]",
              craftableOnly ? "text-white" : "text-[#76583d]",
            )}
          >
            제작가능
          </span>
        </button>
        <FilterChip label="신규" badge="N" />
        <FilterChip label="즐겨찾기" />
      </div>
      <button
        type="button"
        aria-label="정렬 기준"
        className="inline-flex h-[36px] shrink-0 items-center gap-0.5 whitespace-nowrap rounded-xl border border-[#e5caa4] bg-[#fff6e9] px-2 text-[12px] font-extrabold text-[#6b4b35] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.8)] min-[390px]:h-[38px] min-[390px]:gap-1 min-[390px]:px-3 min-[390px]:text-[13px]"
      >
        기본순 <span className="text-[10px]">▼</span>
      </button>
      <button
        type="button"
        aria-label="메뉴"
        className="grid h-[36px] w-[34px] shrink-0 place-items-center rounded-xl border border-[#e5caa4] bg-[#fff6e9] text-lg font-black text-[#6b4b35] min-[390px]:h-[38px] min-[390px]:w-[38px]"
      >
        ≡
      </button>
    </div>
  );
}

function FilterChip({ label, badge }: { label: string; badge?: string }) {
  return (
    <button
      type="button"
      className="relative inline-flex h-[32px] shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-[#e5caa4] bg-[#fff7eb] px-1.5 text-[11px] font-extrabold text-[#76583d] min-[390px]:h-[34px] min-[390px]:gap-1 min-[390px]:px-2.5 min-[390px]:text-[12px]"
    >
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#d4b48b] text-[10px] text-[#8b765f] min-[390px]:h-5 min-[390px]:w-5 min-[390px]:text-[11px]">
        ★
      </span>
      {label}
      {badge ? (
        <span className="absolute -right-1.5 -top-2 grid h-5 w-5 place-items-center rounded-full bg-[#ff9645] text-[10px] text-white ring-2 ring-[#fff7eb]">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function RecipeGrid({
  recipes,
  selectedRecipeId,
  onSelectRecipe,
  layout,
  craftableOnly,
  onToggleCraftable,
}: {
  recipes: WorkbenchRecipe[];
  selectedRecipeId: string;
  onSelectRecipe: (id: string) => void;
  layout: WorkbenchLayout;
  craftableOnly: boolean;
  onToggleCraftable: () => void;
}) {
  const listTop =
    ((layout.filterBar.y + layout.filterBar.height + 18) /
      RECIPE_GRID_LAYOUT_BASE.height) *
    100;

  return (
    <section className="relative h-full rounded-[1.35rem] border border-[#dfc39d]/70 bg-[#fff9ee]/95 p-2 shadow-[0_-5px_16px_rgb(90_61_43_/_0.12)]">
      <LocalLayoutSlot item={layout.filterBar} base={RECIPE_GRID_LAYOUT_BASE}>
        <FilterBar
          craftableOnly={craftableOnly}
          onToggleCraftable={onToggleCraftable}
        />
      </LocalLayoutSlot>

      <div
        className="absolute inset-x-2 bottom-2 overflow-y-auto overflow-x-hidden pr-0.5"
        style={{ top: `${listTop}%` }}
      >
        <div
          className="min-h-full rounded-[1.25rem] p-1.5"
          style={{
            backgroundImage: `url("${stationAsset(stationAssets.cardPanel)}")`,
            backgroundSize: "100% auto",
            backgroundRepeat: "repeat-y",
            backgroundPosition: "center top",
          }}
        >
          <div className="grid grid-cols-2 gap-2.5 pb-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                selected={recipe.id === selectedRecipeId}
                onSelect={() => onSelectRecipe(recipe.id)}
                layout={layout}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecipeCard({
  recipe,
  selected,
  onSelect,
  layout,
}: {
  recipe: WorkbenchRecipe;
  selected: boolean;
  onSelect: () => void;
  layout: WorkbenchLayout;
}) {
  const status = recipe.isNew
    ? "new"
    : recipe.stockReady
      ? "possible"
      : "shortage";

  return (
    <article
      className={cn(
        "relative min-w-0 overflow-visible transition-transform",
        selected && "scale-[0.985]",
      )}
    >
      <Image
        src={stationAsset(stationAssets.cardBase)}
        alt=""
        width={409}
        height={341}
        className="h-auto w-full object-contain"
      />
      <button
        type="button"
        aria-label={`${recipe.name} 선택`}
        aria-pressed={selected}
        className="absolute inset-0 text-left"
        onClick={onSelect}
      >
        <LocalLayoutSlot
          item={status === "new" ? layout.cardNewBadge : layout.cardStatusBadge}
          base={CARD_LAYOUT_BASE}
        >
          <StatusBadge status={status} />
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.cardFavorite} base={CARD_LAYOUT_BASE}>
          <span
            className={cn(
              "grid h-full w-full place-items-center text-[25px] leading-none drop-shadow-[0_1px_0_white]",
              recipe.isFavorite ? "text-[#ffbd3a]" : "text-[#f2d9bb]",
            )}
            aria-hidden
          >
            ★
          </span>
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.cardDrinkImage} base={CARD_LAYOUT_BASE}>
          <Image
            src={publicAssetPath(recipe.imageSrc)}
            alt=""
            width={180}
            height={180}
            className="h-auto w-full object-contain drop-shadow-[0_8px_10px_rgb(90_61_43_/_0.2)]"
          />
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.cardTitle} base={CARD_LAYOUT_BASE}>
          <h3
            className="w-full text-center font-black leading-tight text-[#5a3827]"
            style={{ fontSize: "clamp(13px, 3.4vw, 18px)" }}
          >
            <span className="line-clamp-2">{recipe.name}</span>
          </h3>
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.cardCategoryBadge} base={CARD_LAYOUT_BASE}>
          <CategoryBadge label={recipe.tag} tone={recipe.category} />
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.cardMaterials} base={CARD_LAYOUT_BASE}>
          <div className="grid h-full w-full grid-cols-3 justify-items-center gap-0.5">
          {recipe.materials.slice(0, 3).map((material) => (
            <MaterialTile
              key={material.name}
              material={material}
              iconLayout={layout.cardMaterialIcon}
              textLayout={layout.cardMaterialText}
            />
          ))}
          </div>
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.cardCraftButton} base={CARD_LAYOUT_BASE}>
          <Image
            src={stationAsset(stationAssets.cardButton)}
            alt=""
            width={197}
            height={58}
            className={cn(
              "h-auto w-full object-contain",
              !recipe.stockReady && "opacity-75 saturate-[0.75]",
            )}
          />
          <span className="absolute inset-0 grid place-items-center text-[13px] font-black text-white drop-shadow-[0_1px_0_rgb(45_95_145_/_0.7)]">
            제작하기
          </span>
        </LocalLayoutSlot>
      </button>
    </article>
  );
}

function StatusBadge({ status }: { status: "new" | "possible" | "shortage" }) {
  const asset =
    status === "new"
      ? stationAssets.newBadge
      : status === "possible"
        ? stationAssets.possibleBadge
        : stationAssets.shortageBadge;
  const size =
    status === "new"
      ? { width: 85, height: 44, className: "w-[45px]" }
      : status === "possible"
        ? { width: 144, height: 39, className: "w-[74px]" }
        : { width: 129, height: 43, className: "w-[66px]" };

  return (
    <Image
      src={stationAsset(asset)}
      alt={status === "new" ? "NEW" : status === "possible" ? "제작 가능" : "재료 부족"}
      width={size.width}
      height={size.height}
      className={cn("h-auto object-contain", size.className)}
    />
  );
}

function CategoryBadge({
  label,
  tone,
}: {
  label: string;
  tone: WorkbenchRecipe["category"];
}) {
  const toneClass =
    tone === "tea"
      ? "bg-[#6ba46f]"
      : tone === "special"
        ? "bg-[#ee8751]"
        : tone === "sweet" || tone === "dessert"
          ? "bg-[#4389d5]"
          : "bg-[#4b93de]";

  return (
    <span
      className={cn(
        "mt-1 rounded-md px-2 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-[inset_0_1px_0_rgb(255_255_255_/_0.35)]",
        toneClass,
      )}
    >
      {label}
    </span>
  );
}

function MaterialTile({
  material,
  iconLayout,
  textLayout,
}: {
  material: MaterialPreview;
  iconLayout: WorkbenchLayoutItem;
  textLayout: WorkbenchLayoutItem;
}) {
  const enough = material.have >= material.need;

  return (
    <span className="relative block h-full max-h-full max-w-full aspect-[62/109] min-w-0">
      <Image
        src={stationAsset(stationAssets.materialCard)}
        alt=""
        width={62}
        height={109}
        className="h-full w-auto object-contain"
      />
      <LocalLayoutSlot item={iconLayout} base={MATERIAL_TILE_LAYOUT_BASE}>
        <span className="grid h-full w-full place-items-center text-[14px] leading-none">
          {material.icon}
        </span>
      </LocalLayoutSlot>
      <LocalLayoutSlot item={textLayout} base={MATERIAL_TILE_LAYOUT_BASE}>
        <span className="block h-full w-full text-center">
        <span className="block truncate text-[7px] font-bold leading-tight text-[#6b4b35]">
          {material.name}
        </span>
        <span
          className={cn(
            "mt-0.5 block text-[9px] font-black leading-tight tabular-nums",
            enough ? "text-[#4c321f]" : "text-[#db554e]",
          )}
        >
          {material.have}/{material.need}
        </span>
        </span>
      </LocalLayoutSlot>
    </span>
  );
}

function SelectedRecipePanel({
  recipe,
  craftCount,
  onDec,
  onInc,
  onCraft,
  layout,
}: {
  recipe: WorkbenchRecipe;
  craftCount: number;
  onDec: () => void;
  onInc: () => void;
  onCraft: () => void;
  layout: WorkbenchLayout;
}) {
  return (
    <section className="relative h-full w-full">
      <Image
        src={stationAsset(stationAssets.bottomSelectBg)}
        alt=""
        width={879}
        height={270}
        className="absolute inset-x-0 bottom-0 h-auto w-full object-contain drop-shadow-[0_-5px_12px_rgb(73_47_29_/_0.18)]"
        priority
      />
      <div className="absolute inset-0">
        <LocalLayoutSlot item={layout.bottomLabel} base={BOTTOM_PANEL_LAYOUT_BASE}>
          <div className="grid h-full w-full place-items-center rounded-md bg-[#4c94da] px-2 py-1 text-[12px] font-black text-white shadow-[0_2px_0_#2c6eac]">
            선택 레시피
          </div>
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.bottomDrinkImage} base={BOTTOM_PANEL_LAYOUT_BASE}>
          <Image
            src={publicAssetPath(recipe.imageSrc)}
            alt=""
            width={190}
            height={190}
            className="h-auto w-full object-contain drop-shadow-[0_9px_12px_rgb(84_54_32_/_0.22)]"
          />
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.bottomTitle} base={BOTTOM_PANEL_LAYOUT_BASE}>
          <h2 className="truncate text-[22px] font-black leading-tight text-[#5a3827]">
            {recipe.name}
          </h2>
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.bottomCategoryBadge} base={BOTTOM_PANEL_LAYOUT_BASE}>
          <CategoryBadge label={recipe.tag} tone={recipe.category} />
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.bottomDescription} base={BOTTOM_PANEL_LAYOUT_BASE}>
            <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-relaxed text-[#6f5137]">
              {recipe.description}
            </p>
        </LocalLayoutSlot>

        <LocalLayoutSlot item={layout.bottomStepper} base={BOTTOM_PANEL_LAYOUT_BASE}>
            <div className="flex h-full w-full items-center justify-center rounded-full border border-[#d8bd97] bg-[#f5ead8] px-1 text-[#7b5f49] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]">
              <StepButton label="수량 감소" onClick={onDec}>
                −
              </StepButton>
              <span className="min-w-[32px] text-center text-lg font-black tabular-nums">
                {craftCount}
              </span>
              <StepButton label="수량 증가" onClick={onInc}>
                +
              </StepButton>
            </div>
        </LocalLayoutSlot>
        <LocalLayoutSlot item={layout.bottomCraftButton} base={BOTTOM_PANEL_LAYOUT_BASE}>
            <button
              type="button"
              aria-label={`${recipe.name} 1잔 제작`}
              disabled={!recipe.stockReady}
              className="relative h-full w-full shrink-0 transition-transform active:scale-[0.97] disabled:opacity-65"
              onClick={onCraft}
            >
              <Image
                src={stationAsset(stationAssets.productionButton)}
                alt=""
                width={198}
                height={62}
                className="h-auto w-full object-contain"
              />
              <LocalLayoutSlot
                item={layout.bottomCraftButtonText}
                base={BOTTOM_CRAFT_BUTTON_LAYOUT_BASE}
              >
                <span className="grid h-full w-full place-items-center pb-0.5 text-[17px] font-black text-white drop-shadow-[0_1px_0_rgb(137_91_23_/_0.8)]">
                  1잔 제작
                </span>
              </LocalLayoutSlot>
            </button>
        </LocalLayoutSlot>
      </div>
    </section>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded-full bg-[#ead7bd] text-xl font-black leading-none text-[#75563c] ring-1 ring-[#cfb28c]"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function WorkbenchLayoutSlot({
  item,
  anchor = "top",
  className,
  children,
}: {
  item: WorkbenchLayoutItem;
  anchor?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("absolute", className)}
      style={layoutItemStyle(item, anchor)}
    >
      {children}
    </div>
  );
}

function LocalLayoutSlot({
  item,
  base,
  className,
  children,
}: {
  item: WorkbenchLayoutItem;
  base: { width: number; height: number };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("absolute", className)}
      style={localLayoutItemStyle(item, base)}
    >
      {children}
    </div>
  );
}
