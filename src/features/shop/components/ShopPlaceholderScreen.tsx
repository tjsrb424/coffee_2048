"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LobbyReturnButton } from "@/components/navigation/LobbyReturnButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { puzzleSkinsByKind } from "@/features/meta/cosmetics/puzzleSkins";
import { normalizeAccountLevelState } from "@/features/meta/progression/missionEngine";
import type {
  PuzzleSkinDefinition,
  PuzzleSkinId,
} from "@/features/meta/types/gameState";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { useAppStore } from "@/stores/useAppStore";

const PRODUCTS = [
  {
    id: "ad_free",
    title: "광고 제거 패스",
    blurb: "1.0 일반 노출에서는 숨기고, 출시 후 검토 항목으로만 남겨 둡니다.",
  },
  {
    id: "starter_pack",
    title: "스타터 팩",
    blurb: "실결제/보상 팩은 1.0 범위 밖이라 이번 출시선에서는 열지 않습니다.",
  },
  {
    id: "theme_sakura",
    title: "벚꽃 카페 테마",
    blurb: "꾸미기/테마 BM은 1.0 이후 검토 대상으로만 남겨 둡니다.",
  },
  {
    id: "theme_night_jazz",
    title: "야간 재즈 테마",
    blurb: "꾸미기/테마 BM은 1.0 이후 검토 대상으로만 남겨 둡니다.",
  },
];

/** 1.0 일반 노출에서는 숨긴 비출시 데모 보관함 */
export function ShopPlaceholderScreen() {
  useResetDocumentScrollOnMount();
  const { lightTap } = useGameFeedback();
  const coins = useAppStore((s) => s.playerResources.coins);
  const account = normalizeAccountLevelState(useAppStore((s) => s.accountLevel));
  const cosmetics = useAppStore((s) => s.cosmetics);
  const purchasePuzzleSkin = useAppStore((s) => s.purchasePuzzleSkin);
  const equipPuzzleSkin = useAppStore((s) => s.equipPuzzleSkin);

  return (
    <>
      <AppShell>
        <header className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            Non-release Demo
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-coffee-900">
            비출시 데모 보관함
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-coffee-700">
            이 화면은 1.0 일반 진입점에서 숨겨 둔 데모/출시 후 예정 보관함이에요.
            실제 1.0 기능처럼 노출하지 않고, direct route와 QA 용도로만 남겨 둡니다.
          </p>
        </header>

        <Card className="mb-4 space-y-2 border border-coffee-600/8 bg-cream-50/95 p-4 shadow-card">
          <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            1.0 BM 메모
          </div>
          <p className="text-sm leading-relaxed text-coffee-800">
            1.0에 남는 BM 표면은 오프라인 보상 x2와 퍼즐 결과 x2뿐입니다.
          </p>
          <p className="text-xs leading-relaxed text-coffee-700/78">
            단, 퍼즐 결과 x2는 코인과 원두만 2배로 보고, 미션/손님/도감/해금 진척은
            배수 대상이 아닙니다.
          </p>
          <p className="text-xs leading-relaxed text-coffee-700/78">
            광고 제거, 스타터 팩, 테마/꾸미기, pass/liveOps, 실결제 확장은 이번 출시선에서
            열지 않습니다.
          </p>
        </Card>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          퍼즐 스킨 데모
        </p>
        <Card className="mb-4 space-y-4 border border-coffee-600/8 bg-cream-50/95 p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-coffee-900">
                퍼즐 스킨 직접 테스트
              </div>
              <p className="mt-1 text-xs leading-relaxed text-coffee-700">
                퍼즐 스킨은 현재 direct route/QA 기준으로만 남겨 둔 비출시 데모예요.
                일반 1.0 진입에서는 상점 표면으로 노출하지 않습니다.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-cream-200/70 px-3 py-1.5 text-sm font-bold tabular-nums text-coffee-900 ring-1 ring-coffee-600/8">
              <CoinIcon size={17} className="opacity-95" />
              {coins}
            </div>
          </div>
          <SkinShopGroup
            title="배경 스킨"
            skins={puzzleSkinsByKind("background")}
            accountLevel={account.level}
            coins={coins}
            ownedIds={cosmetics.ownedPuzzleSkinIds}
            equippedId={cosmetics.equippedPuzzleBackgroundSkinId}
            onBuy={(id) => {
              lightTap();
              purchasePuzzleSkin(id);
            }}
            onEquip={(id) => {
              lightTap();
              equipPuzzleSkin(id);
            }}
          />
          <SkinShopGroup
            title="블록 스킨"
            skins={puzzleSkinsByKind("blocks")}
            accountLevel={account.level}
            coins={coins}
            ownedIds={cosmetics.ownedPuzzleSkinIds}
            equippedId={cosmetics.equippedPuzzleBlockSkinId}
            onBuy={(id) => {
              lightTap();
              purchasePuzzleSkin(id);
            }}
            onEquip={(id) => {
              lightTap();
              equipPuzzleSkin(id);
            }}
          />
        </Card>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
          출시 후 예정
        </p>
        <ul className="space-y-3">
          {PRODUCTS.map((p) => {
            return (
              <li key={p.id}>
                <Card className="border border-coffee-600/8 bg-cream-50/95 p-4 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-coffee-900">
                        {p.title}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-coffee-700">
                        {p.blurb}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-coffee-600/70">
                        1.0 비출시 표면
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0"
                      disabled
                    >
                      출시 후 예정
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <LobbyReturnButton />
      </AppShell>
    </>
  );
}

function SkinShopGroup({
  title,
  skins,
  accountLevel,
  coins,
  ownedIds,
  equippedId,
  onBuy,
  onEquip,
}: {
  title: string;
  skins: PuzzleSkinDefinition[];
  accountLevel: number;
  coins: number;
  ownedIds: PuzzleSkinId[];
  equippedId: PuzzleSkinId;
  onBuy: (id: PuzzleSkinId) => void;
  onEquip: (id: PuzzleSkinId) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
        {title}
      </div>
      <ul className="space-y-2">
        {skins.map((skin) => {
          const owned = ownedIds.includes(skin.id);
          const equipped = equippedId === skin.id;
          const levelOk = accountLevel >= skin.requiredLevel;
          const coinOk = coins >= skin.coinCost;
          const canBuy = !owned && levelOk && coinOk;
          const status = owned
            ? equipped
              ? "장착 중"
              : "보유"
            : !levelOk
              ? `Lv.${skin.requiredLevel}`
              : !coinOk
                ? "코인 부족"
                : "구매 가능";
          return (
            <li
              key={skin.id}
              className="rounded-2xl bg-cream-200/50 px-3 py-3 ring-1 ring-coffee-600/6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-bold text-coffee-900">
                      {skin.title}
                    </div>
                    <span className="rounded-full bg-cream-50/80 px-2 py-0.5 text-[10px] font-bold text-coffee-700 ring-1 ring-coffee-600/8">
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-coffee-700">
                    {skin.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {!owned ? (
                    <Button
                      type="button"
                      variant={canBuy ? "soft" : "ghost"}
                      className="h-10 min-h-0 px-3 text-xs"
                      disabled={!canBuy}
                      onClick={() => onBuy(skin.id)}
                    >
                      <span className="inline-flex items-center gap-1">
                        <CoinIcon size={14} className="opacity-95" />
                        {skin.coinCost}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant={equipped ? "ghost" : "soft"}
                      className="h-10 min-h-0 px-3 text-xs"
                      disabled={equipped}
                      onClick={() => onEquip(skin.id)}
                    >
                      {equipped ? "장착" : "장착하기"}
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
