"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  LobbyHotspotConfig,
  LobbyHotspotId,
} from "@/features/lobby/config/lobbyHotspots";
import type { LobbyHotspotVisualHint } from "@/features/lobby/config/lobbySceneDefinition";
import { lobbyAccentRingClass } from "@/features/lobby/lib/lobbyThemeStyles";

type Props = {
  hotspots: LobbyHotspotConfig[];
  themeId: string;
  pulseIds?: Partial<Record<LobbyHotspotId, boolean>>;
  hotspotVisuals?: Partial<Record<LobbyHotspotId, LobbyHotspotVisualHint>>;
  /** 핫존 하단 짧은 상태 태그(가독성) */
  statusChips?: Partial<Record<LobbyHotspotId, string>>;
  onActivate: (hotspot: LobbyHotspotConfig) => void;
};

export function LobbyHotspotLayer({
  hotspots,
  themeId,
  pulseIds,
  hotspotVisuals,
  statusChips,
  onActivate,
}: Props) {
  const [hoveredId, setHoveredId] = useState<LobbyHotspotId | null>(null);

  return (
    <div className="pointer-events-none absolute inset-0">
      {hotspots.map((h) => {
        const pulse = Boolean(pulseIds?.[h.id]);
        const hovered = hoveredId === h.id;
        const emphasized = pulse || hovered;
        const hint = hotspotVisuals?.[h.id];
        const showIdleGlow = Boolean(hint?.idleGlow) && !pulse;

        return (
          <button
            key={h.id}
            type="button"
            style={{
              left: `${h.rect.left}%`,
              top: `${h.rect.top}%`,
              width: `${h.rect.width}%`,
              height: `${h.rect.height}%`,
            }}
            className={cn(
              "group pointer-events-auto absolute rounded-2xl transition-[box-shadow_transform_opacity] duration-200",
              emphasized
                ? cn(
                    "ring-2 shadow-[0_0_0_3px_rgb(196_154_108_/_0.22)]",
                    lobbyAccentRingClass(themeId),
                    pulse && "ring-accent-soft/40",
                  )
                : "ring-0 ring-transparent shadow-[inset_0_0_0_1px_rgb(90_61_43_/_0.08)]",
              !emphasized && "hover:scale-[1.01] active:scale-[0.99]",
            )}
            aria-label={h.label}
            onMouseEnter={() => setHoveredId(h.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(h.id)}
            onBlur={() => setHoveredId(null)}
            onClick={() => onActivate(h)}
          >
            {showIdleGlow ? (
              <span
                className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-coffee-900/5 opacity-70"
                aria-hidden
              />
            ) : null}
            <span className="sr-only">{h.label}</span>
            <div
              className={cn(
                "pointer-events-none absolute bottom-1 left-1/2 flex max-w-[96%] -translate-x-1/2 flex-col items-center gap-0.5",
                "transition-opacity duration-200",
                emphasized
                  ? "opacity-100"
                  : "opacity-70 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100",
              )}
            >
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  "bg-cream-50/92 text-coffee-900 shadow-sm ring-1 ring-coffee-600/12 backdrop-blur-[2px]",
                )}
              >
                {h.label}
              </span>
              {statusChips?.[h.id] ? (
                <span
                  className={cn(
                    "max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-semibold leading-tight",
                    "bg-coffee-900/10 text-coffee-900/95 ring-1 ring-coffee-600/12 backdrop-blur-[2px]",
                    emphasized && "bg-coffee-900/12",
                  )}
                >
                  {statusChips[h.id]}
                </span>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
