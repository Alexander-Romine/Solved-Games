import { TTTBoard, TTTCell, TTTPlayer, TTTWinningLine } from './types';

const WINNING_COMBOS: { indices: [number, number, number]; direction: TTTWinningLine['direction'] }[] = [
  // Rows
  { indices: [0, 1, 2], direction: 'horizontal' },
  { indices: [3, 4, 5], direction: 'horizontal' },
  { indices: [6, 7, 8], direction: 'horizontal' },
  // Columns
  { indices: [0, 3, 6], direction: 'vertical' },
  { indices: [1, 4, 7], direction: 'vertical' },
  { indices: [2, 5, 8], direction: 'vertical' },
  // Diagonals
  { indices: [0, 4, 8], direction: 'diagonal-main' },
  { indices: [2, 4, 6], direction: 'diagonal-anti' },
];

export function createInitialTTTBoard(): TTTBoard {
  return Array(9).fill(null);
}

export function checkTTTWin(board: TTTBoard): TTTWinningLine | null {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo.indices;
    const cellA = board[a];
    if (cellA !== null && cellA === board[b] && cellA === board[c]) {
      return {
        winner: cellA,
        indices: [a, b, c],
        direction: combo.direction,
      };
    }
  }
  return null;
}

export function isTTTFull(board: TTTBoard): boolean {
  return board.every(cell => cell !== null);
}

export function getEmptyTTTIndices(board: TTTBoard): number[] {
  const empty: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) empty.push(i);
  }
  return empty;
}

/**
 * Minimax algorithm for unbeatable 3x3 play.
 * Evaluates terminal states accurately: AI win is positive, human win is negative.
 */
function minimax(
  board: TTTBoard,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const win = checkTTTWin(board);
  if (win) {
    return win.winner === 'O' ? 10 - depth : depth - 10;
  }
  if (isTTTFull(board)) {
    return 0;
  }

  const emptyIndices = getEmptyTTTIndices(board);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of emptyIndices) {
      board[idx] = 'O';
      const score = minimax(board, depth + 1, false, alpha, beta);
      board[idx] = null;
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const idx of emptyIndices) {
      board[idx] = 'X';
      const score = minimax(board, depth + 1, true, alpha, beta);
      board[idx] = null;
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Mathematically Flawless AI Move Selector for 3x3.
 * Incorporates opening book for optimal play against any human start,
 * followed by exhaustive minimax search. Never blunders, never loses.
 */
export function getBestTTTMove(board: TTTBoard): number {
  const empty = getEmptyTTTIndices(board);
  if (empty.length === 0) return 0;

  // 1. Immediate Win: If AI ('O') can complete 3-in-a-row now, do it!
  for (const idx of empty) {
    board[idx] = 'O';
    const win = checkTTTWin(board);
    board[idx] = null;
    if (win && win.winner === 'O') return idx;
  }

  // 2. Immediate Block: If Human ('X') threatens to win, block them immediately!
  for (const idx of empty) {
    board[idx] = 'X';
    const win = checkTTTWin(board);
    board[idx] = null;
    if (win && win.winner === 'X') return idx;
  }

  // 3. Opening Book:
  // Move 0: Empty board (AI starts) -> take center or corner
  if (empty.length === 9) {
    return 4; // Center
  }

  // Move 1: Human made 1 move
  if (empty.length === 8) {
    // If Human took center (4), AI MUST take a corner to ensure draw/win
    if (board[4] === 'X') {
      return 0; // Top-left corner
    }
    // If Human took any corner or edge, AI MUST take center
    return 4;
  }

  // Move 2: Human made 2 moves, AI made 1
  if (empty.length === 6) {
    // Check specific corner traps:
    // If Human has opposite corners (0 and 8) or (2 and 6) and AI is in center (4):
    // AI MUST take an edge (1, 3, 5, or 7) to force human to block, preventing corner fork!
    if (
      (board[0] === 'X' && board[8] === 'X' && board[4] === 'O') ||
      (board[2] === 'X' && board[6] === 'X' && board[4] === 'O')
    ) {
      return 1; // Play edge to force defense
    }

    // If Human has corner and adjacent edge (e.g. 0 and 5 or 0 and 7):
    if (board[4] === 'O') {
      if ((board[0] === 'X' && board[5] === 'X') || (board[2] === 'X' && board[3] === 'X')) return 1;
      if ((board[0] === 'X' && board[7] === 'X') || (board[6] === 'X' && board[1] === 'X')) return 3;
      if ((board[8] === 'X' && board[1] === 'X') || (board[2] === 'X' && board[7] === 'X')) return 5;
      if ((board[8] === 'X' && board[3] === 'X') || (board[6] === 'X' && board[5] === 'X')) return 7;
    }
  }

  // 4. Exhaustive Minimax
  let bestScore = -Infinity;
  let bestMove = empty[0];

  for (const idx of empty) {
    board[idx] = 'O';
    const score = minimax(board, 0, false, -Infinity, Infinity);
    board[idx] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }

  return bestMove;
}
