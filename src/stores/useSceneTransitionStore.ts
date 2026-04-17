"use client";

import { create } from "zustand";

type SceneTransitionPhase = "idle" | "covering" | "revealing";

type SceneTransitionState = {
  visible: boolean;
  phase: SceneTransitionPhase;
  token: number;
  targetPath: string | null;
  begin: (targetPath?: string | null) => void;
  reveal: () => void;
  end: () => void;
};

export const useSceneTransitionStore = create<SceneTransitionState>((set) => ({
  visible: false,
  phase: "idle",
  token: 0,
  targetPath: null,
  begin: (targetPath = null) =>
    set({
      visible: true,
      phase: "covering",
      token: Date.now(),
      targetPath,
    }),
  reveal: () =>
    set((state) =>
      state.visible
        ? {
            ...state,
            phase: "revealing",
          }
        : state,
    ),
  end: () =>
    set({
      visible: false,
      phase: "idle",
      token: 0,
      targetPath: null,
    }),
}));
