"use client";

import { AppShell } from "@/components/layout/AppShell";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card } from "@/components/ui/Card";
import { useGameFeedback } from "@/hooks/useGameFeedback";
import { useResetDocumentScrollOnMount } from "@/hooks/useResetDocumentScrollOnMount";
import { CafeUpgradesCard } from "@/features/menu/components/CafeUpgradesCard";
import { useAppStore } from "@/stores/useAppStore";

export default function MenuPage() {
  useResetDocumentScrollOnMount();
  const settings = useAppStore((s) => s.settings);
  const patch = useAppStore((s) => s.patchSettings);
  const { lightTap } = useGameFeedback();

  return (
    <>
      <AppShell>
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-coffee-600/60">
            Menu
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-coffee-900">
            설정 · 확장
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-coffee-700">
            사운드/햅틱/모션은 여기서 조용히 다듬을 수 있어요.
          </p>
        </header>

        <Card className="mb-4 space-y-3">
          <ToggleRow
            label="사운드"
            description="효과음 재생 (후속 연결 지점)"
            checked={settings.soundOn}
            onChange={(v) => patch({ soundOn: v })}
            onTap={lightTap}
          />
          <ToggleRow
            label="진동"
            description="가벼운 햅틱 피드백"
            checked={settings.vibrationOn}
            onChange={(v) => patch({ vibrationOn: v })}
            onTap={lightTap}
          />
          <ToggleRow
            label="모션 줄이기"
            description="애니메이션을 덜 사용해요"
            checked={settings.reducedMotion}
            onChange={(v) => patch({ reducedMotion: v })}
            onTap={lightTap}
          />
        </Card>

        <CafeUpgradesCard />
      </AppShell>
      <BottomNav />
    </>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  onTap,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  onTap: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-200/60 px-3 py-3 ring-1 ring-coffee-600/5">
      <div>
        <div className="text-sm font-semibold text-coffee-900">{label}</div>
        <div className="mt-1 text-xs text-coffee-700">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => {
          onTap();
          onChange(!checked);
        }}
        className={`flex h-9 w-16 items-center rounded-full p-1 transition-colors ${
          checked ? "justify-end bg-coffee-600" : "justify-start bg-cream-300"
        }`}
      >
        <span className="block h-7 w-7 rounded-full bg-cream-50 shadow-sm" />
      </button>
    </div>
  );
}
