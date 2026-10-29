export type CheckersPlayer = 'p1' | 'p2'; // p1: Red (bottom), p2: Dark/AI (top)

export interface CheckersPiece {
  id: string;
  player: CheckersPlayer;
  isKing: boolean;
}

export type CheckersCell = CheckersPiece | null;

export type CheckersBoard = CheckersCell[][];

export interface Position {
  r: number;
  c: number;
}

export interface CheckersMove {
  from: Position;
  to: Position;
  isJump: boolean;
  captured?: Position;
}
