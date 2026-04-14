import type { Board } from "../types";
import { BOARD_SIZE } from "../types";

export function hasEmptyCell(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) return true;
    }
  }
  return false;
}

export function canMerge(board: Board): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const v = board[r][c]?.value;
      if (v === undefined) continue;
      if (c < BOARD_SIZE - 1) {
        const right = board[r][c + 1]?.value;
        if (right === v) return true;
      }
      if (r < BOARD_SIZE - 1) {
        const down = board[r + 1][c]?.value;
        if (down === v) return true;
      }
    }
  }
  return false;
}

export function canMove(board: Board): boolean {
  return hasEmptyCell(board) || canMerge(board);
}
