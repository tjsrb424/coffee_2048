import { publicAssetPath } from "@/lib/publicAssetPath";

const CLICK_POOL_SIZE = 6;
let sharedClickPool: HTMLAudioElement[] | null = null;
let clickCursor = 0;
let roasterOpenPool: HTMLAudioElement[] | null = null;
let roasterOpenCursor = 0;
let workbenchOpenPool: HTMLAudioElement[] | null = null;
let workbenchOpenCursor = 0;
let counterOpenPool: HTMLAudioElement[] | null = null;
let counterOpenCursor = 0;
let displayStartPool: HTMLAudioElement[] | null = null;
let displayStartCursor = 0;

function makeAudioPool(
  src: string,
  size: number,
  volume: number,
): HTMLAudioElement[] {
  return Array.from({ length: size }, () => {
    const a = new Audio(src);
    a.preload = "auto";
    a.volume = volume;
    return a;
  });
}

function getClickPool(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!sharedClickPool) {
    sharedClickPool = makeAudioPool(publicAssetPath("/sfx/click.mp3"), CLICK_POOL_SIZE, 0.85);
  }
  return sharedClickPool;
}

function getRoasterOpenPool(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!roasterOpenPool) {
    roasterOpenPool = makeAudioPool(publicAssetPath("/sfx/roaster-open.mp3"), 4, 0.92);
  }
  return roasterOpenPool;
}

function getWorkbenchOpenPool(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!workbenchOpenPool) {
    workbenchOpenPool = makeAudioPool(publicAssetPath("/sfx/workbench-open.mp3"), 4, 0.92);
  }
  return workbenchOpenPool;
}

function getCounterOpenPool(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!counterOpenPool) {
    counterOpenPool = makeAudioPool(publicAssetPath("/sfx/counter-open.mp3"), 4, 0.92);
  }
  return counterOpenPool;
}

function getDisplayStartPool(): HTMLAudioElement[] | null {
  if (typeof window === "undefined") return null;
  if (!displayStartPool) {
    displayStartPool = makeAudioPool(publicAssetPath("/sfx/display-start-click.mp3"), 4, 0.95);
  }
  return displayStartPool;
}

function playFromPool(
  pool: HTMLAudioElement[] | null,
  cursor: number,
): { played: boolean; nextCursor: number } {
  if (!pool || pool.length === 0) return { played: false, nextCursor: cursor };
  const a = pool[cursor % pool.length];
  const nextCursor = (cursor + 1) % pool.length;
  try {
    a.currentTime = 0;
    void a.play().catch(() => {});
    return { played: true, nextCursor };
  } catch {
    return { played: false, nextCursor };
  }
}

export function playUiClick(): void {
  const pool = getClickPool();
  const result = playFromPool(pool, clickCursor);
  clickCursor = result.nextCursor;
}

export function playRoasterOpen(): void {
  const pool = getRoasterOpenPool();
  const result = playFromPool(pool, roasterOpenCursor);
  roasterOpenCursor = result.nextCursor;
}

export function playWorkbenchOpen(): void {
  const pool = getWorkbenchOpenPool();
  const result = playFromPool(pool, workbenchOpenCursor);
  workbenchOpenCursor = result.nextCursor;
}

export function playCounterOpen(): void {
  const pool = getCounterOpenPool();
  const result = playFromPool(pool, counterOpenCursor);
  counterOpenCursor = result.nextCursor;
}

export function playDisplayStartClick(): void {
  const pool = getDisplayStartPool();
  const result = playFromPool(pool, displayStartCursor);
  displayStartCursor = result.nextCursor;
}

