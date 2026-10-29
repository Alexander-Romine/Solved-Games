export type Connect4Player = 1 | 2; // 1: Player 1 (Amber/Yellow), 2: Player 2 (Crimson/Red / AI)

export type Connect4Cell = Connect4Player | null;

export type Connect4Board = Connect4Cell[][]; // 6 rows x 7 cols

export interface Connect4WinningLine {
  player: Connect4Player;
  cells: Array<{ r: number; c: number }>;
}
