"use client";

import { useSceneTransitionStore } from "@/stores/useSceneTransitionStore";

const COVER_MS = 170;

export function runSceneTransition(
  navigate: () => void,
  targetPath?: string,
) {
  useSceneTransitionStore.getState().begin(targetPath ?? null);
  window.setTimeout(navigate, COVER_MS);
}
