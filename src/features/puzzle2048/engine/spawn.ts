import type { Board, Tile } from "../types";
import { BOARD_SIZE } from "../types";
import { cloneBoard } from "./boardUtils";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createTile(value: number): Tile {
  return { id: newId(), value };
}

export function pickSpawnValue(): number {
  return Math.random() < 0.9 ? 2 : 4;
}

export function spawnRandomTile(board: Board): Board {
  const empties: { r: number; c: number }[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) empties.push({ r, c });
    }
  }
  if (empties.length === 0) return board;
  const pick = empties[Math.floor(Math.random() * empties.length)];
  const next = cloneBoard(board);
  next[pick.r][pick.c] = createTile(pickSpawnValue());
  return next;
}

export function spawnInitialPair(board: Board): Board {
  let b = spawnRandomTile(board);
  b = spawnRandomTile(b);
  return b;
}
