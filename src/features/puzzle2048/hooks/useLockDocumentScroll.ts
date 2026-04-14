"use client";

import { useEffect } from "react";

/**
 * 퍼즐 플레이 중 브라우저/모바일의 바운스 스크롤·풀투리프레시를 막기 위해
 * html/body 스크롤을 잠근다. 언마운트 시 원복.
 */
export function useLockDocumentScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevHeight = body.style.height;
    const prevOverscroll = body.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.height = "100dvh";
    body.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.height = prevHeight;
      body.style.overscrollBehavior = prevOverscroll;
      if (!prevOverflow) body.style.removeProperty("overflow");
      if (!prevHeight) body.style.removeProperty("height");
      if (!prevOverscroll) body.style.removeProperty("overscroll-behavior");
    };
  }, [enabled]);
}
