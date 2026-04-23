export type PlayerResources = {
  coins: number;
  beans: number;
  hearts: number;
};

export type PuzzleProgress = {
  bestScore: number;
  bestTile: number;
  lastRunScore: number;
  lastRunTile: number;
  lastRunCoins: number;
  lastRunBeans: number;
  lastRunHearts: number;
  totalRuns: number;
};

export type StandardDrinkMenuId = "americano" | "latte" | "affogato";

export type TimeDrinkMenuId =
  | "morning_mist_latte"
  | "dawn_honey_shot"
  | "noon_citrus_coffee"
  | "traveler_blend"
  | "evening_caramel_crema"
  | "sunset_tea_latte"
  | "night_velvet_mocha"
  | "midnight_tonic";

export type DrinkMenuId = StandardDrinkMenuId | TimeDrinkMenuId;

export type MenuStock = Record<DrinkMenuId, number>;

export type BeverageId = string;

export type BeverageCategoryId =
  | "espressoBasic"
  | "milkCoffee"
  | "sweetLatte"
  | "mochaDessert"
  | "teaLatte"
  | "refreshing"
  | "rareIngredient"
  | "timeLimited"
  | "signature"
  | "legendaryCollection";

export type BeverageRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "signature"
  | "legendary";

export type BeverageDefinition = {
  id: BeverageId;
  name: string;
  categoryId: BeverageCategoryId;
  rarity: BeverageRarity;
  description: string;
  unlockLevel: number;
  /** 현재 제작/판매 루프와 직접 연결된 레시피 ID. 없는 항목은 콘텐츠/도감 선등록 상태 */
  recipeId?: DrinkMenuId;
  /** 떠돌이 판매상 등 시간대 전용 노출 슬롯 */
  timeLimited?: TimeOfDayId;
  /** 손님 반응/취향 연결을 위한 예약 슬롯 */
  guestReactionSlot?: string;
};

export type BeverageCategoryDefinition = {
  id: BeverageCategoryId;
  title: string;
  shortTitle: string;
  description: string;
};

export type CodexEntryStage =
  | "locked"
  | "unlocked"
  | "purchased"
  | "crafted"
  | "sold";

export type CodexEntry = {
  beverageId: BeverageId;
  totalSold: number;
  unlockedAtMs: number | null;
  purchasedAtMs: number | null;
  firstCraftedAtMs: number | null;
  firstSoldAtMs: number | null;
  guestReactionSlot?: string | null;
};

export type BeverageCodexState = {
  entries: Record<BeverageId, CodexEntry>;
  purchasedTimeRecipeIds: BeverageId[];
};

export type TimeShopEntry = {
  id: string;
  beverageId: BeverageId;
  timeOfDay: TimeOfDayId;
  price: number;
  requiredLevel: number;
  missionTag?: string;
};

export type PuzzleSkinKind = "background" | "blocks";

export type PuzzleSkinId =
  | "cafe_default_bg"
  | "warm_wood_bg"
  | "night_counter_bg"
  | "cream_default_blocks"
  | "espresso_blocks"
  | "mint_ceramic_blocks";

export type PuzzleSkinDefinition = {
  id: PuzzleSkinId;
  kind: PuzzleSkinKind;
  title: string;
  description: string;
  coinCost: number;
  requiredLevel: number;
};

export type MaterialId =
  | "milk"
  | "cream"
  | "vanillaSyrup"
  | "caramelSyrup"
  | "hazelnutSyrup"
  | "mochaSauce"
  | "honey"
  | "matchaPowder"
  | "blackTeaBase"
  | "fruitBase"
  | "sparklingWater"
  | "rareIngredient";

export type MaterialInventory = Record<MaterialId, number>;

export type MaterialTier = "basic" | "flavor" | "premium" | "rare";

export type MaterialDefinition = {
  id: MaterialId;
  name: string;
  description: string;
  coinCost: number;
  purchaseAmount: number;
  tier: MaterialTier;
};

export type RecipeDefinition = {
  id: DrinkMenuId;
  name: string;
  levelRequired: number;
  purchaseCost: number;
  shopAvailability: "standard" | "timeWindow";
  shots: number;
  beans: number;
  materials: Partial<Record<MaterialId, number>>;
  firstCraftKey: string;
};

export type PricingDefinition = {
  id: DrinkMenuId;
  materialCost: number;
  basePrice: number;
  sellPrice: number;
  profitRating: "steady" | "good" | "premium";
};

export enum MissionCategory {
  Puzzle = "puzzle",
  Production = "production",
  Sales = "sales",
  Collection = "collection",
  ShopTimeLink = "shopTimeLink",
}

export enum MissionType {
  CumulativeScore = "cumulativeScore",
  SingleSessionScore = "singleSessionScore",
  MergeCount = "mergeCount",
  BeansEarned = "beansEarned",
  BeansRoasted = "beansRoasted",
  ShotsCreated = "shotsCreated",
  DrinksCrafted = "drinksCrafted",
  SpecificDrinkSold = "specificDrinkSold",
  TotalDrinksSold = "totalDrinksSold",
  CoinsEarned = "coinsEarned",
  RecipePurchased = "recipePurchased",
  CollectionRegistered = "collectionRegistered",
  TimeRecipePurchased = "timeRecipePurchased",
  TimeDrinkSold = "timeDrinkSold",
  SkinPurchased = "skinPurchased",
}

export type TimeOfDayId = "morning" | "day" | "evening" | "night";

export type MissionDefinition = {
  id: string;
  level: number;
  slotIndex: number;
  category: MissionCategory;
  type: MissionType;
  title: string;
  description?: string;
  target: number;
  params?: {
    drinkId?: DrinkMenuId;
    recipeId?: DrinkMenuId;
    beverageId?: BeverageId;
    timeOfDay?: TimeOfDayId;
    skinId?: string;
    collectionKind?: "guest" | "story" | "recipe";
  };
};

export type MissionSlot = {
  id: string;
  slotIndex: number;
  missionId: string;
  startedAtMs: number;
  completedAtMs: number | null;
};

export type MissionProgressEntry = {
  current: number;
  target: number;
  completed: boolean;
  updatedAtMs: number;
  completedAtMs: number | null;
};

export type MissionProgressState = Record<string, MissionProgressEntry>;

export type LevelBand = {
  id: string;
  tierIndex: number;
  levelMin: number;
  levelMax: number;
  title: string;
  backgroundSlot: string;
};

export type LevelUnlock = {
  level: number;
  title: string;
  preview: string;
  recipeIds?: DrinkMenuId[];
  coinReward?: number;
  beanReward?: number;
};

export type AccountLevelState = {
  level: number;
  tierIndex: number;
  currentLevelCompleted: boolean;
  levelStartedAtMs: number;
  lastLevelUpAtMs: number;
  missionSlots: MissionSlot[];
  missionProgress: MissionProgressState;
  unlockedRecipeIds: DrinkMenuId[];
  purchasedRecipeIds: DrinkMenuId[];
};

export type MissionEvent =
  | {
      type: "puzzleRunCompleted";
      score: number;
      highestTile: number;
      mergeCount: number;
      coins: number;
      beans: number;
      hearts: number;
    }
  | { type: "beansEarned"; amount: number; source: "puzzle" | "gift" | "shop" }
  | { type: "beansRoasted"; amount: number }
  | { type: "shotsCreated"; amount: number }
  | { type: "drinkCrafted"; drinkId: DrinkMenuId; amount: number }
  | {
      type: "drinkSold";
      amount: number;
      soldByMenu: Partial<Record<DrinkMenuId, number>>;
      coins: number;
      timeOfDay?: TimeOfDayId;
    }
  | { type: "coinsEarned"; amount: number; source: "puzzle" | "sale" | "gift" }
  | { type: "recipePurchased"; recipeId: DrinkMenuId; timeOfDay?: TimeOfDayId }
  | {
      type: "timeRecipePurchased";
      beverageId: BeverageId;
      timeOfDay: TimeOfDayId;
    }
  | {
      type: "collectionRegistered";
      collectionKind: "guest" | "story" | "recipe";
      id: string;
    }
  | { type: "skinPurchased"; skinId: string };

export type RewardedAdPlacement =
  | "offline_reward_double"
  | "puzzle_result_double";

export type RewardedAdMockBehavior =
  | "success"
  | "cancel"
  | "error"
  | "no_fill"
  | "unsupported";

export type PendingOfflineReward = {
  claimId: string;
  generatedAtMs: number;
  elapsedMs: number;
  soldCount: number;
  pendingCoins: number;
};

export type PendingPuzzleRewardClaim = {
  claimId: string;
  generatedAtMs: number;
  score: number;
  highestTile: number;
  mergeCount: number;
  baseCoins: number;
  baseBeans: number;
  baseHearts: number;
};

export type CafeState = {
  cafeLevel: number;
  roastLevel: number;
  displayLevel: number;
  ambianceLevel: number;
  /** 로스터 추출 베이스(샷). 음료 제작에 소모돼요. */
  espressoShots: number;
  /** 진열 재고 — 판매 개시 후 틱마다 줄며 코인이 들어와요. */
  menuStock: MenuStock;
  /** 코인으로 구매한 제작 재료 재고 */
  materialInventory: MaterialInventory;
  /** 최초 제작/도감 연결용 제작 완료 메뉴 슬롯 */
  craftedDrinkIds: DrinkMenuId[];
  /**
   * 진열 판매 세션. true일 때만 `stepAutoSell`이 재고를 줄이며 코인을 올린다.
   * 유저가 쇼케이스에서「판매 개시」를 눌러 켠다.
   */
  displaySellingActive: boolean;
  /** 자동 판매 기준 시각(ms). 0이면 첫 진입 시 현재 시각으로만 초기화 */
  lastAutoSellAtMs: number;
  /** 마지막 오프라인 정산 기록 — 로비에서 요약 표시용 */
  lastOfflineSaleAtMs: number;
  lastOfflineSaleCoins: number;
  lastOfflineSaleSoldCount: number;
  /** 아직 수령하지 않은 오프라인 보상 */
  pendingOfflineReward: PendingOfflineReward | null;
};

export type SettingsState = {
  soundOn: boolean;
  vibrationOn: boolean;
  reducedMotion: boolean;
  /** 로비 첫 방문 힌트 배너를 닫았는지(UI 전용) */
  lobbyOnboardingSeen: boolean;
};

export type MetaRuntimeState = {
  /** 하트 회복 기준 시각(ms). 0이면 첫 진입 시 현재 시각으로 초기화 */
  lastHeartRegenAtMs: number;
  /** 오프라인 보상 계산 기준 마지막 접속 시각(ms) */
  lastSeenAtMs: number;
  /** 아직 수령하지 않은 퍼즐 결과 보상 */
  pendingPuzzleRewardClaim: PendingPuzzleRewardClaim | null;
};

/** 웹 BM 권한(실결제 없음 — placeholder 연동용) */
export type BmEntitlementsState = {
  adFree: boolean;
  supporterTier: number;
};

/** 로비 씬 테마 등 코스메틱(퍼즐 공정성과 무관) */
export type CosmeticsState = {
  equippedThemeId: string;
  ownedThemeIds: string[];
  equippedPuzzleBackgroundSkinId: PuzzleSkinId;
  equippedPuzzleBlockSkinId: PuzzleSkinId;
  ownedPuzzleSkinIds: PuzzleSkinId[];
};

/** 시즌 패스 진행(표시·저장 슬롯 — 보상 룰은 후속) */
export type PassProgressState = {
  seasonId: string;
  tier: number;
  xp: number;
  premiumUnlocked: boolean;
};

/** 특별 손님·이벤트 ID만 보관하는 가벼운 슬롯 */
export type LiveOpsSaveState = {
  unlockedGuestIds: string[];
  activeEventIds: string[];
};

export type AppPersistState = {
  playerResources: PlayerResources;
  puzzleProgress: PuzzleProgress;
  cafeState: CafeState;
  accountLevel: AccountLevelState;
  beverageCodex: BeverageCodexState;
  meta: MetaRuntimeState;
  settings: SettingsState;
  bm: BmEntitlementsState;
  cosmetics: CosmeticsState;
  passProgress: PassProgressState;
  liveOps: LiveOpsSaveState;
  ownedProductIds: string[];
};
