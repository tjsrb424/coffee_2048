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

export type DrinkMenuId = "americano" | "latte" | "affogato";

export type MenuStock = Record<DrinkMenuId, number>;

export type CafeState = {
  cafeLevel: number;
  roastLevel: number;
  displayLevel: number;
  ambianceLevel: number;
  /** 로스터 추출 베이스(샷). 음료 제작에 소모돼요. */
  espressoShots: number;
  /** 진열 재고 — 자동 판매로 코인이 들어와요. */
  menuStock: MenuStock;
  /** 자동 판매 기준 시각(ms). 0이면 첫 진입 시 현재 시각으로만 초기화 */
  lastAutoSellAtMs: number;
  /** 마지막 오프라인 정산 기록 — 로비에서 요약 표시용 */
  lastOfflineSaleAtMs: number;
  lastOfflineSaleCoins: number;
  lastOfflineSaleSoldCount: number;
};

export type SettingsState = {
  soundOn: boolean;
  vibrationOn: boolean;
  reducedMotion: boolean;
};

export type AppPersistState = {
  playerResources: PlayerResources;
  puzzleProgress: PuzzleProgress;
  cafeState: CafeState;
  settings: SettingsState;
};
