export type GameId = 'checkers' | 'connect4' | 'mancala' | 'nim' | 'tictactoe' | 'reversi';

export interface GameStats {
  playerWins: number;
  aiWins: number;
  draws: number;
  aiStreak: number;
}

export type AllStats = Record<GameId, GameStats>;
