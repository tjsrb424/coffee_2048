"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EspressoShotIcon } from "@/components/ui/EspressoShotIcon";
import { DRINK_MENU_TEXT_IDS } from "@/data/drinkMenuTextIds";
import { MENU_ORDER } from "@/features/meta/balance/cafeEconomy";
import { getCafeRuntimeModifiers } from "@/features/meta/balance/cafeModifiers";
import { t } from "@/locale/i18n";
import { useAppStore } from "@/stores/useAppStore";
import { cn } from "@/lib/utils";

export function CafeStatusCard() {
  const cafe = useAppStore((s) => s.cafeState);
  const beans = useAppStore((s) => s.playerResources.beans);
  const stock = useAppStore((s) => s.cafeState.menuStock);
  const sellingActive = useAppStore((s) => s.cafeState.displaySellingActive);
  const m = getCafeRuntimeModifiers(cafe);
  const total = stock.americano + stock.latte + stock.affogato;
  const hasAny = total > 0;

  const menuNames = MENU_ORDER.filter((id) => stock[id] > 0).map((id) =>
    t(DRINK_MENU_TEXT_IDS[id].nameTextId),
  );

  return (
    <Card className="mb-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            {t("cafeStatus.heading")}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-coffee-800">
            {t("cafeStatus.intro")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-semibold text-coffee-600/70">
            {sellingActive
              ? t("cafeStatus.sellTickLabel")
              : t("cafeStatus.sellWaitLabel")}
          </div>
          <div className="mt-1 text-sm font-bold tabular-nums text-coffee-900">
            {sellingActive
              ? `${(m.autoSellIntervalMs / 1000).toFixed(1)}s`
              : t("cafeStatus.sellWaitDetail")}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-cream-200/60 px-2 py-2 ring-1 ring-coffee-600/5">
          <div className="text-[10px] font-semibold text-coffee-600/70">
            {t("cafeStatus.stat.beans")}
          </div>
          <div className="mt-0.5 text-base font-bold tabular-nums text-coffee-900">
            {beans}
          </div>
        </div>
        <div className="rounded-2xl bg-cream-200/60 px-2 py-2 ring-1 ring-coffee-600/5">
          <div className="text-[10px] font-semibold text-coffee-600/70">
            {t("cafeStatus.stat.base")}
          </div>
          <div className="mt-0.5 inline-flex items-center justify-center gap-1 text-base font-bold tabular-nums text-coffee-900">
            <EspressoShotIcon size={17} className="opacity-95" />
            {cafe.espressoShots}
          </div>
        </div>
        <div className="rounded-2xl bg-cream-200/60 px-2 py-2 ring-1 ring-coffee-600/5">
          <div className="text-[10px] font-semibold text-coffee-600/70">
            {t("cafeStatus.stat.display")}
          </div>
          <div className="mt-0.5 text-base font-bold tabular-nums text-coffee-900">
            {total}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-coffee-600/75">
          {hasAny
            ? t("cafeStatus.stockLine.withMenu", { menus: menuNames.join(", ") })
            : t("cafeStatus.stockLine.empty")}
        </p>
        <Link
          href="/lobby?panel=cafe"
          className={cn(
            "shrink-0 text-xs font-semibold text-coffee-900",
            !hasAny
              ? "rounded-full bg-cream-200/90 px-3 py-1.5 ring-1 ring-accent-soft/30 hover:bg-cream-200"
              : "underline-offset-2 hover:underline",
          )}
        >
          {t("cafeStatus.link")}
        </Link>
      </div>
    </Card>
  );
}
