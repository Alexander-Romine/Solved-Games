export type MancalaPlayer = 1 | 2; // 1: Player 1 (Bottom), 2: Player 2 (Top / AI)

export interface MancalaState {
  pits: number[]; // Array of 14 numbers. 0-5: P1 pits, 6: P1 Kalah, 7-12: P2 pits, 13: P2 Kalah
  currentPlayer: MancalaPlayer;
  gameOver: boolean;
  winner: MancalaPlayer | 'tie' | null;
  lastActionMessage?: string;
  hadExtraTurn?: boolean;
  lastCapturedCount?: number;
}
