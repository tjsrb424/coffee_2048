/**
 * 퍼즐 세션 목표 (Phase 2 보강) — 수치는 여기서만 조정.
 */
export const SESSION_TARGET_HIGHEST_TILE = 128;

export function isSessionGoalMet(
  highestTile: number,
  target: number = SESSION_TARGET_HIGHEST_TILE,
): boolean {
  return highestTile >= target;
}
