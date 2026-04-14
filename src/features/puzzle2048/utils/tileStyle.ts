import { cn } from "@/lib/utils";

/** 숫자가 커질수록 은은한 존재감 — 과한 네온 없이 티어 구분 */
export function tileClassForValue(value: number): string {
  if (value <= 2) {
    return cn(
      "bg-cream-200 text-coffee-700 shadow-inner",
      "ring-1 ring-black/5",
    );
  }
  if (value <= 4) {
    return cn(
      "bg-cream-300 text-coffee-700 shadow-inner",
      "ring-1 ring-black/5",
    );
  }
  if (value <= 16) {
    return cn(
      "bg-[#e8d5c4] text-coffee-700 shadow-sm",
      "ring-1 ring-wood-500/15",
    );
  }
  if (value <= 32) {
    return cn(
      "bg-[#dfc2a8] text-coffee-900 shadow-sm",
      "ring-1 ring-wood-500/20",
    );
  }
  if (value <= 64) {
    return cn(
      "bg-[#d2a882] text-coffee-900 shadow-md",
      "ring-1 ring-coffee-600/25",
    );
  }
  if (value <= 128) {
    return cn(
      "bg-gradient-to-br from-[#c9956a] to-[#b07a4c] text-white shadow-md",
      "ring-1 ring-white/20",
    );
  }
  if (value <= 256) {
    return cn(
      "bg-gradient-to-br from-[#b87345] to-[#8f5630] text-cream-50 shadow-md",
      "ring-1 ring-white/25",
    );
  }
  if (value <= 512) {
    return cn(
      "bg-gradient-to-br from-[#9a5a3a] to-[#6d3d28] text-cream-50 shadow-lg",
      "ring-1 ring-white/30",
    );
  }
  return cn(
    "bg-gradient-to-br from-coffee-700 to-coffee-900 text-cream-50 shadow-lg",
    "ring-1 ring-accent-mint/30",
  );
}

export function tileFontSize(value: number, compact?: boolean): string {
  if (compact) {
    if (value < 100) return "text-lg leading-tight sm:text-3xl sm:leading-normal";
    if (value < 1000) return "text-base leading-tight sm:text-2xl sm:leading-normal";
    return "text-sm leading-tight sm:text-xl sm:leading-normal";
  }
  if (value < 100) return "text-2xl sm:text-3xl";
  if (value < 1000) return "text-xl sm:text-2xl";
  return "text-lg sm:text-xl";
}
