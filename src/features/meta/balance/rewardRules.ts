/**
 * Sprint 1 임시 밸런스 — 수치만 조정하면 됨.
 */
export const REWARD_SCORE_TO_COIN_DIVISOR = 10;

/** 원두 보상: 최고 타일이 이 값 이상일 때만 지급 */
export const BEAN_REWARD_MIN_TILE = 128;

/** 원두 = floor(highestTile / BEAN_REWARD_DIVISOR) */
export const BEAN_REWARD_DIVISOR = 32;

/** 하트 보너스: 최고 타일이 이 값 이상이면 1 */
export const HEART_BONUS_MIN_TILE = 256;

export const HEART_BONUS_AMOUNT = 1;
