"use client";

import { useEffect } from "react";

/**
 * 퍼즐 등에서 body/html에 건 인라인 스크롤 잠금이 라우트 전환 후 남지 않도록 제거한다.
 */
export function useResetDocumentScrollOnMount() {
  useEffect(() => {
    document.documentElement.style.removeProperty("overflow");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("height");
    document.body.style.removeProperty("overscroll-behavior");
  }, []);
}
