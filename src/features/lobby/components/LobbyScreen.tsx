"use client";

import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { useLobbyFxStore } from "@/stores/useLobbyFxStore";
import { LastRunCard } from "./LastRunCard";
import { LobbyMainCard } from "./LobbyMainCard";
import { LobbyAmbientCustomers } from "./LobbyAmbientCustomers";
import { OfflineSalesCard } from "./OfflineSalesCard";
import { ResourceBar } from "./ResourceBar";

export function LobbyScreen() {
  useResetDocumentScrollOnMount();
  const purchasePulse = useLobbyFxStore((s) => s.purchasePulse);
  const purchaseKind = useLobbyFxStore((s) => s.purchaseKind);

  return (
    <>
      <AppShell>
        <header className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            Lobby
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-coffee-900">
            따뜻한 로비
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-coffee-700">
            퍼즐 한 판이 곧 매장의 온도를 바꿔요. 로스팅·메뉴 제작·진열 판매는
            하단 카페 탭에서 이어가요.
          </p>
        </header>

        <div className="relative mb-5">
          <LobbyAmbientCustomers
            purchasePulse={purchasePulse}
            purchaseKind={purchaseKind}
          />
          <ResourceBar />
        </div>
        <OfflineSalesCard />
        <LastRunCard />
        <LobbyMainCard />
      </AppShell>
      <BottomNav />
    </>
  );
}
