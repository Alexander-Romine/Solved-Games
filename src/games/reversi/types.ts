export type ReversiPlayer = 'black' | 'white';

export type ReversiCell = ReversiPlayer | null;

export type ReversiBoard = ReversiCell[][];

export interface ReversiMove {
  row: number;
  col: number;
  flipped: { row: number; col: number }[];
}

export interface ReversiScore {
  black: number;
  white: number;
}
