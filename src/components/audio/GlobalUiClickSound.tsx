"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { playUiClick } from "@/lib/sfx";

function isDisabledEl(el: Element): boolean {
  if (el instanceof HTMLButtonElement) return el.disabled;
  if (el instanceof HTMLInputElement) return el.disabled;
  if (el instanceof HTMLAnchorElement) return el.getAttribute("aria-disabled") === "true";
  return el.getAttribute("aria-disabled") === "true";
}

export function GlobalUiClickSound() {
  const soundOn = useAppStore((s) => s.settings.soundOn);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!soundOn) return;

    const onPointerDownCapture = (e: Event) => {
      const target = e.target as Element | null;
      if (!target) return;
      const el = target.closest(
        "button, a, [role='button'], [role='switch'], [data-ui-click]",
      );
      if (!el) return;
      if (el.closest("[data-no-ui-click='true']")) return;
      if (isDisabledEl(el)) return;
      playUiClick();
    };

    window.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [soundOn]);

  return null;
}

