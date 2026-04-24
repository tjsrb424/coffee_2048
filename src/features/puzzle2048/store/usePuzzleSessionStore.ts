"use client";

import { create } from "zustand";
import {
  canMove,
  createEmptyBoard,
  getHighestTileValue,
  moveBoard,
  spawnInitialPair,
  spawnRandomTile,
} from "@/features/puzzle2048/engine";
import { PUZZLE_MOVE_ANIMATION_MS } from "@/features/puzzle2048/constants/animation";
import type { Board, Direction } from "@/features/puzzle2048/types";

function boardValueMap(board: Board): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      m.set(cell.id, cell.value);
    }
  }
  return m;
}

function mergePulseStrength(value: number): number {
  // 2,4,8.. 특성상 log2로 “단계”를 추정한다.
  // 과장 금지: 0.0~1.0 범위로 약하게만 스케일링.
  const step = Math.log2(Math.max(2, value));
  // 4~256 사이를 0~1로 부드럽게 매핑 (그 이상은 1로 클램프)
  const t = (step - 2) / 6;
  return Math.min(1, Math.max(0, t));
}

export type PuzzleSessionState = {
  board: Board;
  score: number;
  gameOver: boolean;
  /** 이동/합체 애니메이션 동안만 입력을 잠근다. spawn pop-in은 포함하지 않는다. */
  inputLocked: boolean;
  lastMergeCount: number;
  sessionMergeCount: number;
  lastScoreDelta: number;
  /** 이번 입력으로 “합체 결과”가 된 타일(id)과 펄스 강도 */
  lastMergePulseById: Record<string, number>;
  startFresh: () => void;
  /** 이동 시도. 이동 중이면 마지막 방향 1개만 큐에 보관한다. */
  tryMove: (dir: Direction) => void;
};

export const usePuzzleSessionStore = create<PuzzleSessionState>((set, get) => {
  let queuedDirection: Direction | null = null;
  let moveCycleId = 0;
  let moveTimer: number | null = null;
  let queuedMoveRaf: number | null = null;
  let mergeCountResetTimer: number | null = null;
  let scoreDeltaResetTimer: number | null = null;
  let mergePulseResetTimer: number | null = null;

  const clearMoveTimer = () => {
    if (moveTimer !== null) {
      window.clearTimeout(moveTimer);
      moveTimer = null;
    }
  };

  const clearQueuedMoveRaf = () => {
    if (queuedMoveRaf !== null) {
      window.cancelAnimationFrame(queuedMoveRaf);
      queuedMoveRaf = null;
    }
  };

  const clearFeedbackTimers = () => {
    if (mergeCountResetTimer !== null) {
      window.clearTimeout(mergeCountResetTimer);
      mergeCountResetTimer = null;
    }
    if (scoreDeltaResetTimer !== null) {
      window.clearTimeout(scoreDeltaResetTimer);
      scoreDeltaResetTimer = null;
    }
    if (mergePulseResetTimer !== null) {
      window.clearTimeout(mergePulseResetTimer);
      mergePulseResetTimer = null;
    }
  };

  const resetPendingMotion = () => {
    moveCycleId += 1;
    queuedDirection = null;
    clearMoveTimer();
    clearQueuedMoveRaf();
    clearFeedbackTimers();
  };

  const scheduleFeedbackResets = () => {
    clearFeedbackTimers();
    mergeCountResetTimer = window.setTimeout(() => set({ lastMergeCount: 0 }), 320);
    scoreDeltaResetTimer = window.setTimeout(() => set({ lastScoreDelta: 0 }), 520);
    mergePulseResetTimer = window.setTimeout(
      () => set({ lastMergePulseById: {} }),
      240,
    );
  };

  const executeMove = (dir: Direction) => {
    const s = get();
    if (s.gameOver) return;

    const moved = moveBoard(s.board, dir);
    if (!moved.moved) return;

    // 엔진을 건드리지 않고 “합체된 타일”만 UI에 전달.
    // mergeLineLeft는 합체 결과 타일의 id를 유지(cur.id)하므로
    // 전/후 value가 증가한 id를 합체 타일로 본다.
    const beforeMap = boardValueMap(s.board);
    const afterMoveMap = boardValueMap(moved.board);
    const lastMergePulseById: Record<string, number> = {};
    for (const [id, nextVal] of afterMoveMap.entries()) {
      const prevVal = beforeMap.get(id);
      if (prevVal !== undefined && nextVal > prevVal) {
        lastMergePulseById[id] = mergePulseStrength(nextVal);
      }
    }

    queuedDirection = null;
    clearMoveTimer();
    clearQueuedMoveRaf();

    const nextScore = s.score + moved.scoreDelta;
    moveCycleId += 1;
    const cycleId = moveCycleId;

    set({
      board: moved.board,
      score: nextScore,
      lastMergeCount: moved.mergeCount,
      sessionMergeCount: s.sessionMergeCount + moved.mergeCount,
      lastScoreDelta: moved.scoreDelta,
      lastMergePulseById,
      gameOver: false,
      inputLocked: true,
    });
    scheduleFeedbackResets();

    moveTimer = window.setTimeout(() => {
      if (cycleId !== moveCycleId) return;

      const spawned = spawnRandomTile(moved.board);
      const over = !canMove(spawned);
      const queued = queuedDirection;
      queuedDirection = null;

      set({
        board: spawned,
        gameOver: over,
        inputLocked: false,
      });

      if (!queued || over) return;

      queuedMoveRaf = window.requestAnimationFrame(() => {
        queuedMoveRaf = null;
        if (cycleId !== moveCycleId) return;
        executeMove(queued);
      });
    }, PUZZLE_MOVE_ANIMATION_MS);
  };

  return {
    board: createEmptyBoard(),
    score: 0,
    gameOver: false,
    inputLocked: false,
    lastMergeCount: 0,
    sessionMergeCount: 0,
    lastScoreDelta: 0,
    lastMergePulseById: {},
    startFresh: () => {
      resetPendingMotion();
      const board = spawnInitialPair(createEmptyBoard());
      set({
        board,
        score: 0,
        gameOver: false,
        inputLocked: false,
        lastMergeCount: 0,
        sessionMergeCount: 0,
        lastScoreDelta: 0,
        lastMergePulseById: {},
      });
    },
    tryMove: (dir) => {
      const s = get();
      if (s.gameOver) return;
      if (s.inputLocked) {
        queuedDirection = dir;
        return;
      }
      executeMove(dir);
    },
  };
});

export function readPuzzleOutcomeFromState(state: PuzzleSessionState): {
  score: number;
  highestTile: number;
  mergeCount: number;
} {
  return {
    score: state.score,
    highestTile: getHighestTileValue(state.board),
    mergeCount: state.sessionMergeCount,
  };
}
