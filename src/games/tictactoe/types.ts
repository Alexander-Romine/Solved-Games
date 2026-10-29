export type TTTPlayer = 'X' | 'O';

export type TTTCell = TTTPlayer | null;

export type TTTBoard = TTTCell[]; // 9 cells (3x3)

export interface TTTWinningLine {
  winner: TTTPlayer;
  indices: number[];
  direction: 'horizontal' | 'vertical' | 'diagonal-main' | 'diagonal-anti';
}
