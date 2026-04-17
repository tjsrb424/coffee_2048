"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

type Props = {
  onCafePanelFromQuery: () => void;
};

/**
 * `useSearchParams`는 Suspense 경계가 필요하다. 로비 본문 전체를 막지 않도록
 * 이 컴포넌트만 감싼다.
 */
export function LobbyPanelQuerySync({ onCafePanelFromQuery }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("panel") === "cafe") {
      onCafePanelFromQuery();
      if (typeof window !== "undefined") {
        const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
          /\/$/,
          "",
        );
        window.history.replaceState(null, "", `${base}/lobby/`);
      }
    }
  }, [searchParams, onCafePanelFromQuery]);

  return null;
}
