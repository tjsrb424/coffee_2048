"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import {
  WORKBENCH_LAYOUT_BASE,
  WORKBENCH_LAYOUT_KEYS,
  WORKBENCH_LAYOUT_LABELS,
  type WorkbenchLayout,
  type WorkbenchLayoutItem,
  type WorkbenchLayoutKey,
} from "@/features/lobby/config/workbenchLayout";
import { cn } from "@/lib/utils";

type WorkbenchTuningPanelProps = {
  layout: WorkbenchLayout;
  selectedKey: WorkbenchLayoutKey;
  onSelectedKeyChange: (key: WorkbenchLayoutKey) => void;
  onLayoutItemChange: (
    key: WorkbenchLayoutKey,
    patch: Partial<WorkbenchLayoutItem>,
  ) => void;
  onResetLayout: () => void;
};

const CONTROL_CLASS =
  "h-8 rounded-xl border border-coffee-600/15 bg-cream-50/92 px-2 text-xs font-semibold text-coffee-950 outline-none ring-1 ring-coffee-600/10 focus:border-accent-soft/50 focus:ring-accent-soft/35";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readNumber(event: ChangeEvent<HTMLInputElement>, fallback: number) {
  const value = event.currentTarget.valueAsNumber;
  return Number.isFinite(value) ? value : fallback;
}

export function WorkbenchTuningPanel({
  layout,
  selectedKey,
  onSelectedKeyChange,
  onLayoutItemChange,
  onResetLayout,
}: WorkbenchTuningPanelProps) {
  const selected = layout[selectedKey];
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const layoutJsonText = JSON.stringify(layout, null, 2);

  const flashHint = useCallback((message: string) => {
    setCopyHint(message);
    window.setTimeout(() => setCopyHint(null), 4000);
  }, []);

  const copyLayoutJson = useCallback(async () => {
    const text = JSON.stringify(layout, null, 2);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        flashHint("클립보드에 복사했어요.");
        return;
      }
    } catch {
      // noop
    }
    flashHint("자동 복사가 막혀 있어요. 아래 JSON을 직접 복사해 주세요.");
  }, [flashHint, layout]);

  const downloadLayoutJson = useCallback(() => {
    const text = JSON.stringify(layout, null, 2);
    const blob = new Blob([text], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coffee2048-workbench-layout.json";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flashHint("coffee2048-workbench-layout.json 파일을 저장했어요.");
  }, [flashHint, layout]);

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[130] w-[calc(100vw-1.5rem)] max-w-[22rem] text-coffee-950">
      <div
        className="pointer-events-auto overflow-y-auto overscroll-contain rounded-3xl bg-cream-50/94 p-3 shadow-[0_18px_48px_rgb(42_27_18_/_0.18)] ring-1 ring-coffee-600/12 backdrop-blur-md"
        style={{ maxHeight: "min(78dvh, 34rem)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-coffee-950/60">
              Workbench tuning
            </div>
            <p className="mt-1 text-xs leading-relaxed text-coffee-950/82">
              기준 좌표: {WORKBENCH_LAYOUT_BASE.width}×{WORKBENCH_LAYOUT_BASE.height}px
            </p>
          </div>
          <button
            type="button"
            onClick={onResetLayout}
            className="rounded-full bg-coffee-950/8 px-3 py-1.5 text-[11px] font-bold text-coffee-950 ring-1 ring-coffee-600/12"
          >
            Reset
          </button>
        </div>

        <label className="mt-3 block text-[11px] font-bold text-coffee-950/75">
          Element
          <select
            value={selectedKey}
            onChange={(event) =>
              onSelectedKeyChange(event.currentTarget.value as WorkbenchLayoutKey)
            }
            className={cn(CONTROL_CLASS, "mt-1 w-full")}
          >
            {WORKBENCH_LAYOUT_KEYS.map((key) => (
              <option key={key} value={key}>
                {WORKBENCH_LAYOUT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField
            label="x"
            value={selected.x}
            step={1}
            onChange={(x) => onLayoutItemChange(selectedKey, { x })}
          />
          <NumberField
            label="y"
            value={selected.y}
            step={1}
            onChange={(y) => onLayoutItemChange(selectedKey, { y })}
          />
          <NumberField
            label="width"
            value={selected.width}
            step={1}
            min={1}
            onChange={(width) => onLayoutItemChange(selectedKey, { width })}
          />
          <NumberField
            label="height"
            value={selected.height}
            step={1}
            min={1}
            onChange={(height) => onLayoutItemChange(selectedKey, { height })}
          />
          <NumberField
            label="scale"
            value={selected.scale}
            step={0.01}
            min={0.05}
            onChange={(scale) => onLayoutItemChange(selectedKey, { scale })}
          />
          <NumberField
            label="zIndex"
            value={selected.zIndex}
            step={1}
            onChange={(zIndex) => onLayoutItemChange(selectedKey, { zIndex })}
          />
          <NumberField
            label="opacity"
            value={selected.opacity ?? 1}
            step={0.01}
            min={0}
            max={1}
            onChange={(opacity) =>
              onLayoutItemChange(selectedKey, {
                opacity: clampNumber(opacity, 0, 1),
              })
            }
          />
        </div>

        <div className="mt-3 rounded-2xl bg-coffee-950/5 p-2 ring-1 ring-coffee-600/10">
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-coffee-950/55">
            Quick nudge
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { x: selected.x - 10 })}>
              x -10
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { x: selected.x - 1 })}>
              x -1
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { x: selected.x + 1 })}>
              x +1
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { x: selected.x + 10 })}>
              x +10
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { y: selected.y - 10 })}>
              y -10
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { y: selected.y - 1 })}>
              y -1
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { y: selected.y + 1 })}>
              y +1
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { y: selected.y + 10 })}>
              y +10
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { zIndex: selected.zIndex - 1 })}>
              z -1
            </NudgeButton>
            <NudgeButton onClick={() => onLayoutItemChange(selectedKey, { zIndex: selected.zIndex + 1 })}>
              z +1
            </NudgeButton>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void copyLayoutJson()}
            className="w-full rounded-2xl bg-coffee-950/10 py-2.5 text-[11px] font-bold text-coffee-950 ring-1 ring-coffee-600/14 active:scale-[0.99]"
          >
            Copy layout JSON
          </button>
          <button
            type="button"
            onClick={downloadLayoutJson}
            className="w-full rounded-2xl bg-coffee-950/16 py-2.5 text-[11px] font-bold text-coffee-950 ring-1 ring-coffee-600/14 active:scale-[0.99]"
          >
            파일로 저장 (JSON)
          </button>
        </div>

        {copyHint ? (
          <p className="mt-2 rounded-2xl bg-accent-mint/25 px-2.5 py-2 text-[11px] font-semibold leading-snug text-coffee-900 ring-1 ring-accent-mint/35">
            {copyHint}
          </p>
        ) : null}

        <label className="mt-3 block text-[10px] font-bold text-coffee-950/70">
          수동 복사
          <textarea
            readOnly
            rows={5}
            value={layoutJsonText}
            className={cn(
              CONTROL_CLASS,
              "mt-1 max-h-32 w-full resize-y font-mono text-[10px] leading-snug text-coffee-900",
            )}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      </div>
    </div>
  );
}

function NudgeButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 rounded-xl bg-cream-50/92 px-1.5 text-[10px] font-black text-coffee-950 ring-1 ring-coffee-600/12 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-[11px] font-bold text-coffee-950/75">
      {label}
      <input
        type="number"
        value={Number(value.toFixed(step < 1 ? 2 : 0))}
        step={step}
        min={min}
        max={max}
        onChange={(event) => onChange(readNumber(event, value))}
        className={cn(CONTROL_CLASS, "mt-1 w-full tabular-nums")}
      />
    </label>
  );
}
