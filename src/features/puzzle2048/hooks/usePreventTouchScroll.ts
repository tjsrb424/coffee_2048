"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * 제스처 캡처 영역에서 세로/가로 팬(페이지 스크롤)이 발생하지 않도록
 * touchmove 기본 동작을 막는다. passive: false 필요.
 */
export function usePreventTouchScroll() {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const block = (e: TouchEvent) => {
      e.preventDefault();
    };
    el.addEventListener("touchmove", block, { passive: false });
    return () => el.removeEventListener("touchmove", block);
  }, []);

  return ref;
}
