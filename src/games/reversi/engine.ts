import { ReversiBoard, ReversiCell, ReversiMove, ReversiPlayer, ReversiScore } from './types';

export const BOARD_SIZE = 8;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function createInitialBoard(): ReversiBoard {
  const board: ReversiBoard = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Standard center disc setup with White (Player) moving first
  // Row 3: Col 3 is Black, Col 4 is White
  // Row 4: Col 3 is White, Col 4 is Black
  board[3][3] = 'black';
  board[3][4] = 'white';
  board[4][3] = 'white';
  board[4][4] = 'black';

  return board;
}

export function cloneBoard(board: ReversiBoard): ReversiBoard {
  return board.map(row => [...row]);
}

export function getOpponent(player: ReversiPlayer): ReversiPlayer {
  return player === 'black' ? 'white' : 'black';
}

export function getFlippedDiscs(
  board: ReversiBoard,
  row: number,
  col: number,
  player: ReversiPlayer
): { row: number; col: number }[] {
  if (board[row][col] !== null) {
    return [];
  }

  const opponent = getOpponent(player);
  const flipped: { row: number; col: number }[] = [];

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const directionFlips: { row: number; col: number }[] = [];

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === opponent) {
      directionFlips.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    if (
      directionFlips.length > 0 &&
      r >= 0 &&
      r < BOARD_SIZE &&
      c >= 0 &&
      c < BOARD_SIZE &&
      board[r][c] === player
    ) {
      flipped.push(...directionFlips);
    }
  }

  return flipped;
}

export function getLegalMoves(board: ReversiBoard, player: ReversiPlayer): ReversiMove[] {
  const moves: ReversiMove[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === null) {
        const flipped = getFlippedDiscs(board, r, c, player);
        if (flipped.length > 0) {
          moves.push({ row: r, col: c, flipped });
        }
      }
    }
  }

  return moves;
}

export function applyMove(
  board: ReversiBoard,
  move: ReversiMove,
  player: ReversiPlayer
): ReversiBoard {
  const nextBoard = cloneBoard(board);
  nextBoard[move.row][move.col] = player;
  for (const { row, col } of move.flipped) {
    nextBoard[row][col] = player;
  }
  return nextBoard;
}

export function countDiscs(board: ReversiBoard): ReversiScore {
  let black = 0;
  let white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++;
      else if (board[r][c] === 'white') white++;
    }
  }
  return { black, white };
}

// Classical Othello positional weight matrix
const POSITION_WEIGHTS: number[][] = [
  [120, -25,  20,   5,   5,  20, -25, 120],
  [-25, -50,  -5,  -5,  -5,  -5, -50, -25],
  [ 20,  -5,  15,   3,   3,  15,  -5,  20],
  [  5,  -5,   3,   3,   3,   3,  -5,   5],
  [  5,  -5,   3,   3,   3,   3,  -5,   5],
  [ 20,  -5,  15,   3,   3,  15,  -5,  20],
  [-25, -50,  -5,  -5,  -5,  -5, -50, -25],
  [120, -25,  20,   5,   5,  20, -25, 120],
];

function evaluateBoard(board: ReversiBoard, player: ReversiPlayer): number {
  const opponent = getOpponent(player);
  let positionalScore = 0;
  let playerDiscs = 0;
  let opponentDiscs = 0;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === player) {
        playerDiscs++;
        positionalScore += POSITION_WEIGHTS[r][c];
      } else if (cell === opponent) {
        opponentDiscs++;
        positionalScore -= POSITION_WEIGHTS[r][c];
      }
    }
  }

  // Corner stability bonus
  const corners = [
    [0, 0], [0, 7], [7, 0], [7, 7],
  ];
  let cornerScore = 0;
  for (const [cr, cc] of corners) {
    if (board[cr][cc] === player) cornerScore += 35;
    else if (board[cr][cc] === opponent) cornerScore -= 35;
  }

  // Mobility (number of moves available)
  const playerMobility = getLegalMoves(board, player).length;
  const opponentMobility = getLegalMoves(board, opponent).length;
  let mobilityScore = 0;
  if (playerMobility + opponentMobility > 0) {
    mobilityScore = 100 * (playerMobility - opponentMobility) / (playerMobility + opponentMobility);
  }

  // Phase-dependent weighting: mobility/positions in early/mid game; disc count in late game
  const totalDiscs = playerDiscs + opponentDiscs;
  if (totalDiscs > 54) {
    // Endgame: disc count dominates
    return (playerDiscs - opponentDiscs) * 100 + cornerScore;
  }

  return positionalScore + cornerScore + mobilityScore * 2;
}

function minimax(
  board: ReversiBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: ReversiPlayer
): number {
  const currentPlayer = isMaximizing ? aiPlayer : getOpponent(aiPlayer);
  const moves = getLegalMoves(board, currentPlayer);

  // If no moves, check if opponent also has no moves (game over)
  if (moves.length === 0) {
    const opponentMoves = getLegalMoves(board, getOpponent(currentPlayer));
    if (opponentMoves.length === 0 || depth <= 0) {
      return evaluateBoard(board, aiPlayer);
    }
    // Pass turn
    return minimax(board, depth - 1, alpha, beta, !isMaximizing, aiPlayer);
  }

  if (depth <= 0) {
    return evaluateBoard(board, aiPlayer);
  }

  // Sort moves by positional weight for better alpha-beta pruning
  moves.sort((a, b) => POSITION_WEIGHTS[b.row][b.col] - POSITION_WEIGHTS[a.row][a.col]);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(board, move, currentPlayer);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextBoard = applyMove(board, move, currentPlayer);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestReversiMove(board: ReversiBoard, aiPlayer: ReversiPlayer): ReversiMove | null {
  const legalMoves = getLegalMoves(board, aiPlayer);
  if (legalMoves.length === 0) return null;
  if (legalMoves.length === 1) return legalMoves[0];

  // Prioritize immediate corners
  for (const move of legalMoves) {
    if (
      (move.row === 0 || move.row === 7) &&
      (move.col === 0 || move.col === 7)
    ) {
      return move;
    }
  }

  const depth = 3;
  let bestScore = -Infinity;
  let bestMove = legalMoves[0];
  let alpha = -Infinity;
  const beta = Infinity;

  // Move ordering for root
  legalMoves.sort((a, b) => POSITION_WEIGHTS[b.row][b.col] - POSITION_WEIGHTS[a.row][a.col]);

  for (const move of legalMoves) {
    const nextBoard = applyMove(board, move, aiPlayer);
    const score = minimax(nextBoard, depth - 1, alpha, beta, false, aiPlayer);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestMove;
}
