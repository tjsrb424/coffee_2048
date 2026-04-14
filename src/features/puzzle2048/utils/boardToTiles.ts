import type { Board, Tile } from "../types";
import { BOARD_SIZE } from "../types";

export type PlacedTile = Tile & { r: number; c: number };

export function boardToTiles(board: Board): PlacedTile[] {
  const tiles: PlacedTile[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell) tiles.push({ ...cell, r, c });
    }
  }
  return tiles;
}
