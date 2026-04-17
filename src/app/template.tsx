"use client";

import { DevDebugPanel } from "@/components/dev/DevDebugPanel";

export default function Template({ children }: { children: React.ReactNode }) {
  const forceDebug = process.env.NEXT_PUBLIC_ENABLE_DEV_DEBUG === "true";
  return (
    <div className="min-h-[100dvh] w-full">
      {children}
      {(forceDebug || process.env.NODE_ENV !== "production") && <DevDebugPanel />}
    </div>
  );
}
