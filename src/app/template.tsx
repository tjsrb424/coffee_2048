"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DevDebugPanel } from "@/components/dev/DevDebugPanel";
import { ReadOnlyAdDebugPanel } from "@/components/dev/ReadOnlyAdDebugPanel";

const READ_ONLY_AD_DEBUG_QUERY_PARAM = "ad_debug";
/** 예: `/lobby?coffee_dev=1` — 한 번 켜면 같은 탭에서는 sessionStorage로 유지(브라우저 닫기 전까지) */
const DEV_PANEL_QUERY_PARAM = "coffee_dev";
const DEV_PANEL_SESSION_KEY = "coffee2048_show_dev_panel" as const;

const forceDevPanelFromEnv =
  process.env.NEXT_PUBLIC_COFFEE2048_DEV_PANEL === "1";

function isLocalhostDevHost() {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".localhost")
  );
}

/** production 등에서 호스트만으로는 DEV가 꺼질 때: 쿼리 또는 이전에 켠 세션 */
function readDevPanelOptInFromBrowser(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get(
      DEV_PANEL_QUERY_PARAM,
    );
    if (q === "1") {
      window.sessionStorage.setItem(DEV_PANEL_SESSION_KEY, "1");
      return true;
    }
    if (q === "0") {
      window.sessionStorage.removeItem(DEV_PANEL_SESSION_KEY);
      return false;
    }
    return window.sessionStorage.getItem(DEV_PANEL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function shouldShowReadOnlyAdDebugPanel() {
  if (typeof window === "undefined") return false;
  return (
    new URLSearchParams(window.location.search).get(
      READ_ONLY_AD_DEBUG_QUERY_PARAM,
    ) === "1"
  );
}

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNonProductionBuild = process.env.NODE_ENV !== "production";
  const [showDevDebugPanel, setShowDevDebugPanel] = useState(
    () => isNonProductionBuild || forceDevPanelFromEnv,
  );
  const [showReadOnlyAdDebugPanel, setShowReadOnlyAdDebugPanel] = useState(false);

  useEffect(() => {
    if (isNonProductionBuild || forceDevPanelFromEnv) return;
    setShowDevDebugPanel(
      isLocalhostDevHost() || readDevPanelOptInFromBrowser(),
    );
  }, [isNonProductionBuild, pathname]);

  useEffect(() => {
    if (isNonProductionBuild) return;
    setShowReadOnlyAdDebugPanel(shouldShowReadOnlyAdDebugPanel());
  }, [isNonProductionBuild, pathname]);

  return (
    <div className="min-h-[100dvh] w-full">
      {children}
      {showDevDebugPanel ? <DevDebugPanel /> : null}
      {!showDevDebugPanel && showReadOnlyAdDebugPanel ? (
        <ReadOnlyAdDebugPanel />
      ) : null}
    </div>
  );
}
