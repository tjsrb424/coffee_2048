export const BOARD_SIZE = 4 as const;

export type Direction = "up" | "down" | "left" | "right";

export type Tile = {
  id: string;
  value: number;
};

export type Cell = Tile | null;

export type Board = Cell[][];
