import {
  BEAN_REWARD_DIVISOR,
  BEAN_REWARD_MIN_TILE,
  HEART_BONUS_AMOUNT,
  HEART_BONUS_MIN_TILE,
  REWARD_SCORE_TO_COIN_DIVISOR,
} from "../balance/rewardRules";

export type PuzzleRewards = {
  coins: number;
  beans: number;
  hearts: number;
};

export function computePuzzleRewards(
  score: number,
  highestTile: number,
): PuzzleRewards {
  const coins = Math.floor(score / REWARD_SCORE_TO_COIN_DIVISOR);
  const beans =
    highestTile >= BEAN_REWARD_MIN_TILE
      ? Math.floor(highestTile / BEAN_REWARD_DIVISOR)
      : 0;
  const hearts =
    highestTile >= HEART_BONUS_MIN_TILE ? HEART_BONUS_AMOUNT : 0;
  return { coins, beans, hearts };
}
