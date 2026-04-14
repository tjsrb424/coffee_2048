import type { Cell, Tile } from "../types";
import { BOARD_SIZE } from "../types";

export type MergeLineResult = {
  line: Cell[];
  scoreDelta: number;
  mergeCount: number;
};

/**
 * 한 줄을 '왼쪽'으로 밀고 합친 결과. (right/up/down은 호출 전에 배열을 뒤집어서 사용)
 */
export function mergeLineLeft(cells: Cell[]): MergeLineResult {
  const tiles = cells.filter((c): c is Tile => c !== null);
  const line: Cell[] = [];
  let scoreDelta = 0;
  let mergeCount = 0;
  let i = 0;
  while (i < tiles.length) {
    const cur = tiles[i];
    const next = tiles[i + 1];
    if (next && cur.value === next.value) {
      const mergedValue = cur.value * 2;
      scoreDelta += mergedValue;
      mergeCount += 1;
      line.push({ id: cur.id, value: mergedValue });
      i += 2;
    } else {
      line.push(cur);
      i += 1;
    }
  }
  while (line.length < BOARD_SIZE) line.push(null);
  return { line, scoreDelta, mergeCount };
}
