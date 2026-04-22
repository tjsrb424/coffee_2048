"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { CafeUpgradesCard } from "@/features/menu/components/CafeUpgradesCard";
import { ResourceBar } from "@/features/lobby/components/ResourceBar";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { LiveOpsPlaceholderSection } from "./LiveOpsPlaceholderSection";

export function ExtensionHubScreen() {
  useResetDocumentScrollOnMount();

  return (
    <>
      <AppShell>
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            Growth
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-coffee-900">
            설비 성장
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-coffee-700">
            1.0에서 이 화면에 남는 것은 설비 업그레이드입니다. 시즌, 패스, 이벤트 같은
            확장 표면은 출시 후 예정 메모로만 낮춰 둡니다.
          </p>
          <p className="mt-2 text-xs text-coffee-600/75">
            <Link
              href="/lobby"
              className="font-semibold underline-offset-2 hover:underline"
            >
              로비로
            </Link>
          </p>
        </header>

        <ResourceBar variant="compact" />

        <Card className="mt-4 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            1.0 포함 범위
          </div>
          <p className="mt-2 text-sm leading-relaxed text-coffee-800">
            현재 일반 유저 기준으로는 설비 업그레이드만 활성 기능으로 보고, 시즌 패스,
            liveOps, 이벤트 손님 표면은 일반 출시 기능처럼 보이지 않게 유지합니다.
          </p>
        </Card>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            설비 성장
          </p>
          <CafeUpgradesCard />
        </div>

        <LiveOpsPlaceholderSection />
      </AppShell>
    </>
  );
}
