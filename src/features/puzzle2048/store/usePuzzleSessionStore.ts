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
import type { Board, Direction } from "@/features/puzzle2048/types";

export type PuzzleSessionState = {
  board: Board;
  score: number;
  gameOver: boolean;
  inputLocked: boolean;
  lastMergeCount: number;
  lastScoreDelta: number;
  startFresh: () => void;
  /** 이동 시도. 성공하면 짧게 입력 잠금 */
  tryMove: (dir: Direction) => void;
};

export const usePuzzleSessionStore = create<PuzzleSessionState>((set, get) => ({
  board: createEmptyBoard(),
  score: 0,
  gameOver: false,
  inputLocked: false,
  lastMergeCount: 0,
  lastScoreDelta: 0,
  startFresh: () => {
    const board = spawnInitialPair(createEmptyBoard());
    set({
      board,
      score: 0,
      gameOver: false,
      inputLocked: false,
      lastMergeCount: 0,
      lastScoreDelta: 0,
    });
  },
  tryMove: (dir) => {
    const s = get();
    if (s.inputLocked || s.gameOver) return;
    const moved = moveBoard(s.board, dir);
    if (!moved.moved) return;
    const spawned = spawnRandomTile(moved.board);
    const nextScore = s.score + moved.scoreDelta;
    const over = !canMove(spawned);
    set({
      board: spawned,
      score: nextScore,
      lastMergeCount: moved.mergeCount,
      lastScoreDelta: moved.scoreDelta,
      gameOver: over,
      inputLocked: true,
    });
    window.setTimeout(() => {
      if (get().inputLocked) set({ inputLocked: false });
    }, 175);
    window.setTimeout(() => set({ lastMergeCount: 0 }), 320);
    window.setTimeout(() => set({ lastScoreDelta: 0 }), 520);
  },
}));

export function readPuzzleOutcomeFromState(state: PuzzleSessionState): {
  score: number;
  highestTile: number;
} {
  return { score: state.score, highestTile: getHighestTileValue(state.board) };
}
