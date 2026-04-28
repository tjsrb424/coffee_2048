export const LOBBY_LAYOUT_BASE = {
  width: 942,
  height: 1672,
} as const;

export type LobbyLayoutItem = {
  x: number;
  y: number;
  width: number;
  scale: number;
  zIndex: number;
  opacity?: number;
};

export const LOBBY_LAYOUT_KEYS = [
  "titleLogo",
  "tierBadge",
  "menuButton",
  "shelfFrame",
  "roasterCard",
  "drinkStationCard",
  "cashierCard",
  "shopCard",
  "playButton",
  "currencyBar",
] as const;

export type LobbyLayoutKey = (typeof LOBBY_LAYOUT_KEYS)[number];
export type LobbyLayout = Record<LobbyLayoutKey, LobbyLayoutItem>;
export type LobbyLayoutPatch = Partial<
  Record<LobbyLayoutKey, Partial<LobbyLayoutItem>>
>;

export const lobbyLayout: LobbyLayout = {
  titleLogo: { x: 210, y: 72, width: 510, scale: 1, zIndex: 100 },
  tierBadge: { x: 44, y: 33, width: 159, scale: 1, zIndex: 40 },
  menuButton: { x: 801, y: 46, width: 116, scale: 1, zIndex: 40 },
  shelfFrame: {
    x: -78,
    y: -328,
    width: 978,
    scale: 1.13,
    zIndex: 31,
    opacity: 1,
  },
  roasterCard: { x: 44, y: 415, width: 425, scale: 1, zIndex: 30 },
  drinkStationCard: { x: 472, y: 417, width: 425, scale: 1, zIndex: 30 },
  cashierCard: { x: 44, y: 894, width: 424, scale: 1, zIndex: 30 },
  shopCard: { x: 472, y: 895, width: 420, scale: 1, zIndex: 30 },
  playButton: { x: 76, y: 1313, width: 758, scale: 1, zIndex: 30 },
  currencyBar: { x: 160, y: 1530, width: 622, scale: 1, zIndex: 30 },
};

export const LOBBY_LAYOUT_LABELS: Record<LobbyLayoutKey, string> = {
  titleLogo: "Title logo",
  tierBadge: "Tier badge",
  menuButton: "Menu button",
  shelfFrame: "Shelf frame",
  roasterCard: "Roaster card",
  drinkStationCard: "Drink station card",
  cashierCard: "Cashier card",
  shopCard: "Shop card",
  playButton: "Play button",
  currencyBar: "Currency bar",
};

function numericOrFallback(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function mergeLobbyLayoutPatch(
  base: LobbyLayout,
  patch: unknown,
): LobbyLayout {
  if (!patch || typeof patch !== "object") return base;

  return LOBBY_LAYOUT_KEYS.reduce((next, key) => {
    const patchItem = (patch as LobbyLayoutPatch)[key];
    if (!patchItem || typeof patchItem !== "object") {
      next[key] = base[key];
      return next;
    }

    next[key] = {
      x: numericOrFallback(patchItem.x, base[key].x),
      y: numericOrFallback(patchItem.y, base[key].y),
      width: numericOrFallback(patchItem.width, base[key].width),
      scale: numericOrFallback(patchItem.scale, base[key].scale),
      zIndex: numericOrFallback(patchItem.zIndex, base[key].zIndex),
      opacity:
        patchItem.opacity == null
          ? base[key].opacity
          : numericOrFallback(patchItem.opacity, base[key].opacity ?? 1),
    };
    return next;
  }, {} as LobbyLayout);
}
