import { expect, test, type Page } from "@playwright/test";
import { createEmptyBoard, moveBoard, type MoveBoardResult } from "../../src/features/puzzle2048/engine";
import { createTile } from "../../src/features/puzzle2048/engine/spawn";
import { PUZZLE_MOVE_ANIMATION_MS } from "../../src/features/puzzle2048/constants/animation";
import type { Board, Direction } from "../../src/features/puzzle2048/types";
import {
  readPuzzleOutcomeFromState,
  usePuzzleSessionStore,
} from "../../src/features/puzzle2048/store/usePuzzleSessionStore";

type TileSnapshot = {
  row: number;
  col: number;
  value: number;
};

class FakeClock {
  private now = 0;
  private nextId = 1;
  private tasks = new Map<number, { runAt: number; fn: () => void }>();

  readonly windowLike = {
    setTimeout: (fn: () => void, delay = 0) => this.setTimeout(fn, delay),
    clearTimeout: (id: number) => this.clearTimeout(id),
    requestAnimationFrame: (fn: (time: number) => void) =>
      this.requestAnimationFrame(fn),
    cancelAnimationFrame: (id: number) => this.cancelAnimationFrame(id),
  };

  advance(ms: number) {
    const target = this.now + ms;
    while (true) {
      const next = [...this.tasks.entries()]
        .sort((a, b) => a[1].runAt - b[1].runAt || a[0] - b[0])
        .find(([, task]) => task.runAt <= target);
      if (!next) break;
      const [id, task] = next;
      this.tasks.delete(id);
      this.now = task.runAt;
      task.fn();
    }
    this.now = target;
  }

  private setTimeout(fn: () => void, delay: number) {
    const id = this.nextId++;
    this.tasks.set(id, {
      runAt: this.now + delay,
      fn,
    });
    return id;
  }

  private clearTimeout(id: number) {
    this.tasks.delete(id);
  }

  private requestAnimationFrame(fn: (time: number) => void) {
    const id = this.nextId++;
    const runAt = this.now + 16;
    this.tasks.set(id, {
      runAt,
      fn: () => fn(runAt),
    });
    return id;
  }

  private cancelAnimationFrame(id: number) {
    this.tasks.delete(id);
  }
}

function sortBoard(tiles: TileSnapshot[]) {
  return [...tiles].sort(
    (a, b) => a.row - b.row || a.col - b.col || a.value - b.value,
  );
}

function makeBoard(rows: number[][]): Board {
  const board = createEmptyBoard();
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const value = rows[r][c];
      board[r][c] = value > 0 ? createTile(value) : null;
    }
  }
  return board;
}

function boardValues(board: Board) {
  return board.map((row) => row.map((cell) => cell?.value ?? 0));
}

function resetSession(board: Board) {
  usePuzzleSessionStore.getState().startFresh();
  usePuzzleSessionStore.setState({
    board,
    score: 0,
    gameOver: false,
    inputLocked: false,
    lastMergeCount: 0,
    sessionMergeCount: 0,
    lastScoreDelta: 0,
    lastMergePulseById: {},
  });
}

function makeBrowserBoard(snapshot: TileSnapshot[]): Board {
  const board = createEmptyBoard();
  for (const tile of snapshot) {
    board[tile.row][tile.col] = createTile(tile.value);
  }
  return board;
}

function findFirstValidMove(snapshot: TileSnapshot[]): MoveBoardResult & {
  dir: Direction;
} {
  const board = makeBrowserBoard(snapshot);
  for (const dir of ["up", "down", "left", "right"] as const) {
    const result = moveBoard(board, dir);
    if (result.moved) {
      return { dir, ...result };
    }
  }
  throw new Error("expected at least one valid move");
}

async function readBoard(page: Page): Promise<TileSnapshot[]> {
  return sortBoard(
    await page.getByTestId("puzzle-tile").evaluateAll((nodes) =>
      nodes.map((node) => ({
        row: Number(node.getAttribute("data-row")),
        col: Number(node.getAttribute("data-col")),
        value: Number(node.getAttribute("data-value")),
      })),
    ),
  );
}

async function swipe(page: Page, dir: Direction) {
  const surface = page.getByTestId("puzzle-gesture-surface");
  const box = await surface.boundingBox();
  if (!box) {
    throw new Error("missing puzzle gesture surface");
  }

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const travel = Math.min(box.width, box.height) * 0.28;
  const delta =
    dir === "left"
      ? { x: -travel, y: 0 }
      : dir === "right"
        ? { x: travel, y: 0 }
        : dir === "up"
          ? { x: 0, y: -travel }
          : { x: 0, y: travel };

  await surface.dispatchEvent("pointerdown", {
    bubbles: true,
    cancelable: true,
    clientX: cx,
    clientY: cy,
    isPrimary: true,
    pointerId: 1,
    pointerType: "touch",
  });
  await surface.dispatchEvent("pointerup", {
    bubbles: true,
    cancelable: true,
    clientX: cx + delta.x,
    clientY: cy + delta.y,
    isPrimary: true,
    pointerId: 1,
    pointerType: "touch",
  });
}

let originalMathRandom = Math.random;
let originalWindow: unknown;
let clock: FakeClock;

test.beforeEach(() => {
  originalWindow = (globalThis as { window?: unknown }).window;
  originalMathRandom = Math.random;
  clock = new FakeClock();
  (globalThis as { window?: unknown }).window = clock.windowLike;
  Math.random = () => 0;
  resetSession(createEmptyBoard());
});

test.afterEach(() => {
  usePuzzleSessionStore.getState().startFresh();
  Math.random = originalMathRandom;
  (globalThis as { window?: unknown }).window = originalWindow;
});

test("move animation completes before spawn and no-op move never spawns", () => {
  resetSession(
    makeBoard([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]),
  );

  usePuzzleSessionStore.getState().tryMove("left");

  let state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [4, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(true);
  expect(state.score).toBe(4);
  expect(state.lastScoreDelta).toBe(4);
  expect(state.lastMergeCount).toBe(1);

  clock.advance(PUZZLE_MOVE_ANIMATION_MS - 1);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [4, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(true);

  clock.advance(1);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [4, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(false);
  expect(state.gameOver).toBe(false);
  expect(readPuzzleOutcomeFromState(state)).toEqual({
    score: 4,
    highestTile: 4,
    mergeCount: 1,
  });

  state.tryMove("left");
  clock.advance(PUZZLE_MOVE_ANIMATION_MS + 32);
  expect(boardValues(usePuzzleSessionStore.getState().board)).toEqual([
    [4, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
});

test("last queued direction runs after spawn and spawn does not keep input locked", () => {
  resetSession(
    makeBoard([
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]),
  );

  usePuzzleSessionStore.getState().tryMove("left");
  clock.advance(10);
  usePuzzleSessionStore.getState().tryMove("up");
  usePuzzleSessionStore.getState().tryMove("right");

  clock.advance(PUZZLE_MOVE_ANIMATION_MS - 10);
  let state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [4, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(false);

  clock.advance(15);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [4, 2, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(false);

  clock.advance(1);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [0, 0, 4, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(true);

  clock.advance(PUZZLE_MOVE_ANIMATION_MS);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [2, 0, 4, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(state.inputLocked).toBe(false);
});

test("game over is decided only after the post-move spawn", () => {
  resetSession(
    makeBoard([
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 0, 32],
    ]),
  );

  usePuzzleSessionStore.getState().tryMove("right");

  let state = usePuzzleSessionStore.getState();
  expect(state.gameOver).toBe(false);
  expect(boardValues(state.board)).toEqual([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2, 4],
    [0, 8, 16, 32],
  ]);

  clock.advance(PUZZLE_MOVE_ANIMATION_MS - 1);
  expect(usePuzzleSessionStore.getState().gameOver).toBe(false);

  clock.advance(1);
  state = usePuzzleSessionStore.getState();
  expect(boardValues(state.board)).toEqual([
    [2, 4, 8, 16],
    [32, 64, 128, 256],
    [512, 1024, 2, 4],
    [2, 8, 16, 32],
  ]);
  expect(state.gameOver).toBe(true);
});

test("merge rules still keep classic 2048 behavior", () => {
  const simpleMerge = createEmptyBoard();
  simpleMerge[0][0] = createTile(2);
  simpleMerge[0][1] = createTile(2);

  const mergedOnce = moveBoard(simpleMerge, "left");
  expect(mergedOnce.moved).toBe(true);
  expect(mergedOnce.scoreDelta).toBe(4);
  expect(mergedOnce.mergeCount).toBe(1);
  expect(mergedOnce.board[0].map((cell) => cell?.value ?? 0)).toEqual([4, 0, 0, 0]);

  const chainMerge = createEmptyBoard();
  chainMerge[0][0] = createTile(2);
  chainMerge[0][1] = createTile(2);
  chainMerge[0][2] = createTile(2);
  chainMerge[0][3] = createTile(2);

  const mergedTwice = moveBoard(chainMerge, "left");
  expect(mergedTwice.moved).toBe(true);
  expect(mergedTwice.scoreDelta).toBe(8);
  expect(mergedTwice.mergeCount).toBe(2);
  expect(mergedTwice.board[0].map((cell) => cell?.value ?? 0)).toEqual([4, 4, 0, 0]);
});

test("touch swipe still triggers a valid move on the live puzzle board", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/puzzle");
  await expect(page.getByTestId("puzzle-board-visual-mask")).toBeVisible();

  const before = await readBoard(page);
  const next = findFirstValidMove(before);

  await swipe(page, next.dir);

  await expect
    .poll(() => readBoard(page), {
      timeout: 500,
    })
    .not.toEqual(before);
});
