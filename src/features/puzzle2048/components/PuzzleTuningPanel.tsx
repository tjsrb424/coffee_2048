"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import {
  PUZZLE_LAYOUT_KEYS,
  PUZZLE_LAYOUT_HINTS,
  PUZZLE_LAYOUT_LABELS,
  PUZZLE_LAYOUT_BASE,
  type PuzzleLayout,
  type PuzzleLayoutItem,
  type PuzzleLayoutKey,
} from "@/features/puzzle2048/config/puzzleLayout";
import { cn } from "@/lib/utils";

type PuzzleTuningPanelProps = {
  layout: PuzzleLayout;
  selectedKey: PuzzleLayoutKey;
  overlayEnabled: boolean;
  overlayOpacity: number;
  onSelectedKeyChange: (key: PuzzleLayoutKey) => void;
  onLayoutItemChange: (
    key: PuzzleLayoutKey,
    patch: Partial<PuzzleLayoutItem>,
  ) => void;
  onResetLayout: () => void;
  onOverlayEnabledChange: (enabled: boolean) => void;
  onOverlayOpacityChange: (opacity: number) => void;
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

export function PuzzleTuningPanel({
  layout,
  selectedKey,
  overlayEnabled,
  overlayOpacity,
  onSelectedKeyChange,
  onLayoutItemChange,
  onResetLayout,
  onOverlayEnabledChange,
  onOverlayOpacityChange,
}: PuzzleTuningPanelProps) {
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
        flashHint("클립보드에 복사했어요. 채팅에 붙여넣기(Ctrl+V)로 전달하면 됩니다.");
        return;
      }
    } catch {
      // Clipboard API 거부/비보안 컨텍스트 등 → textarea 폴백
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.setAttribute("aria-hidden", "true");
      ta.tabIndex = -1;
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "2px";
      ta.style.height = "2px";
      ta.style.opacity = "0.02";
      ta.style.padding = "0";
      ta.style.border = "0";
      ta.style.outline = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) {
        flashHint("복사했어요. 안 됐다면 아래 JSON을 드래그해 선택한 뒤 Ctrl+C 하세요.");
      } else {
        flashHint("자동 복사에 실패했어요. 아래 JSON을 직접 선택해 복사하거나 ‘파일로 저장’을 눌러주세요.");
      }
    } catch {
      flashHint("복사에 실패했어요. 아래 JSON을 드래그해 선택한 뒤 Ctrl+C 하거나 ‘파일로 저장’을 이용해주세요.");
    }
  }, [flashHint, layout]);

  const downloadLayoutJson = useCallback(() => {
    const text = JSON.stringify(layout, null, 2);
    const blob = new Blob([text], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coffee2048-puzzle-layout.json";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    flashHint("coffee2048-puzzle-layout.json 파일을 저장했어요. 그 파일을 채팅에 첨부하거나 내용을 붙여넣으면 됩니다.");
  }, [flashHint, layout]);

  return (
    <div className="pointer-events-none fixed right-3 top-3 z-[120] w-[calc(100vw-1.5rem)] max-w-[22rem] text-coffee-950">
      <div
        className="pointer-events-auto overflow-y-auto overscroll-contain rounded-3xl bg-cream-50/94 p-3 shadow-[0_18px_48px_rgb(42_27_18_/_0.18)] ring-1 ring-coffee-600/12 backdrop-blur-md"
        style={{ maxHeight: "min(78dvh, 34rem)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-coffee-950/60">
              Puzzle tuning
            </div>
            <p className="mt-1 text-xs leading-relaxed text-coffee-950/82">
              기준: reference 원본 {PUZZLE_LAYOUT_BASE.width}×
              {PUZZLE_LAYOUT_BASE.height}px
            </p>
          </div>
          <button
            type="button"
            onClick={onResetLayout}
            className="shrink-0 rounded-full bg-coffee-950/8 px-3 py-1.5 text-[11px] font-bold text-coffee-950 ring-1 ring-coffee-600/12"
          >
            Reset
          </button>
        </div>

        <label className="mt-3 block text-[11px] font-bold text-coffee-950/75">
          Element
          <select
            value={selectedKey}
            onChange={(event) =>
              onSelectedKeyChange(event.currentTarget.value as PuzzleLayoutKey)
            }
            className={cn(CONTROL_CLASS, "mt-1 w-full")}
          >
            {PUZZLE_LAYOUT_KEYS.map((key) => (
              <option key={key} value={key}>
                {PUZZLE_LAYOUT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        {PUZZLE_LAYOUT_HINTS[selectedKey] ? (
          <p className="mt-2 rounded-2xl bg-coffee-950/6 p-2.5 text-[11px] leading-relaxed text-coffee-950/78 ring-1 ring-coffee-600/10">
            {PUZZLE_LAYOUT_HINTS[selectedKey]}
          </p>
        ) : null}

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
          <div className="flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-coffee-950/88">
              <input
                type="checkbox"
                checked={overlayEnabled}
                onChange={(event) =>
                  onOverlayEnabledChange(event.currentTarget.checked)
                }
                className="h-4 w-4 accent-[#f0c36f]"
              />
              Reference overlay
            </label>
            <span className="text-[11px] font-semibold tabular-nums text-coffee-950/70">
              {Math.round(overlayOpacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={overlayOpacity}
            onChange={(event) =>
              onOverlayOpacityChange(
                clampNumber(readNumber(event, overlayOpacity), 0.05, 1),
              )
            }
            className="mt-2 w-full accent-[#f0c36f]"
          />
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
          수동 복사 (클립보드가 막혀 있을 때)
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

        <p className="mt-3 text-[11px] leading-relaxed text-coffee-950/68">
          화살표는 1px, Shift+화살표는 10px 이동입니다. 입력칸에 포커스가 있을
          때는 키보드 이동을 멈춥니다.
        </p>
      </div>
    </div>
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
