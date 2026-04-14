"use client";

import { useEffect } from "react";
import type { Direction } from "@/features/puzzle2048/types";

type Args = {
  enabled: boolean;
  onDirection: (dir: Direction) => void;
};

export function usePuzzleKeyboard({ enabled, onDirection }: Args) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onDirection("up");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onDirection("down");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onDirection("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onDirection("right");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onDirection]);
}
