import type { Board, Cell, Direction } from "../types";
import { BOARD_SIZE } from "../types";
import { boardLinesEqual, cloneBoard } from "./boardUtils";
import { mergeLineLeft } from "./mergeLine";

export type MoveBoardResult = {
  board: Board;
  moved: boolean;
  scoreDelta: number;
  mergeCount: number;
};

function readRow(board: Board, r: number): Cell[] {
  return board[r].slice();
}

function writeRow(target: Board, r: number, line: Cell[]) {
  for (let c = 0; c < BOARD_SIZE; c++) target[r][c] = line[c];
}

function readCol(board: Board, c: number): Cell[] {
  const col: Cell[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) col.push(board[r][c]);
  return col;
}

function writeCol(target: Board, c: number, line: Cell[]) {
  for (let r = 0; r < BOARD_SIZE; r++) target[r][c] = line[r];
}

export function moveBoard(board: Board, direction: Direction): MoveBoardResult {
  const next = cloneBoard(board);
  let moved = false;
  let scoreDelta = 0;
  let mergeCount = 0;

  if (direction === "left") {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const before = readRow(board, r);
      const { line, scoreDelta: sd, mergeCount: mc } = mergeLineLeft(before);
      if (!boardLinesEqual(before, line)) moved = true;
      scoreDelta += sd;
      mergeCount += mc;
      writeRow(next, r, line);
    }
  } else if (direction === "right") {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const before = readRow(board, r);
      const reversed = [...before].reverse();
      const { line: merged, scoreDelta: sd, mergeCount: mc } =
        mergeLineLeft(reversed);
      const line = [...merged].reverse();
      if (!boardLinesEqual(before, line)) moved = true;
      scoreDelta += sd;
      mergeCount += mc;
      writeRow(next, r, line);
    }
  } else if (direction === "up") {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const before = readCol(board, c);
      const { line, scoreDelta: sd, mergeCount: mc } = mergeLineLeft(before);
      if (!boardLinesEqual(before, line)) moved = true;
      scoreDelta += sd;
      mergeCount += mc;
      writeCol(next, c, line);
    }
  } else {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const before = readCol(board, c);
      const reversed = [...before].reverse();
      const { line: merged, scoreDelta: sd, mergeCount: mc } =
        mergeLineLeft(reversed);
      const line = [...merged].reverse();
      if (!boardLinesEqual(before, line)) moved = true;
      scoreDelta += sd;
      mergeCount += mc;
      writeCol(next, c, line);
    }
  }

  return { board: next, moved, scoreDelta, mergeCount };
}
