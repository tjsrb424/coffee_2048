import type { AppPersistState } from "@/features/meta/types/gameState";

export const selectPlayerResources = (s: AppPersistState) => s.playerResources;
export const selectPuzzleProgress = (s: AppPersistState) => s.puzzleProgress;
export const selectCafeState = (s: AppPersistState) => s.cafeState;
