import type { Board, Cell } from "../types";
import { BOARD_SIZE } from "../types";

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) row.push(null);
    board.push(row);
  }
  return board;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((c) => (c ? { ...c } : null)));
}

export function boardLinesEqual(a: Cell[], b: Cell[]): boolean {
  for (let i = 0; i < BOARD_SIZE; i++) {
    const x = a[i];
    const y = b[i];
    if (x === null && y === null) continue;
    if (x === null || y === null) return false;
    if (x.id !== y.id || x.value !== y.value) return false;
  }
  return true;
}

export function getHighestTileValue(board: Board): number {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.value > max) max = cell.value;
    }
  }
  return max;
}
