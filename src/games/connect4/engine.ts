import { Connect4Board, Connect4Player, Connect4WinningLine } from './types';

export const ROWS = 6;
export const COLS = 7;

export function createInitialConnect4Board(): Connect4Board {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
}

export function cloneConnect4Board(board: Connect4Board): Connect4Board {
  return board.map(row => [...row]);
}

export function getAvailableRow(board: Connect4Board, col: number): number {
  if (col < 0 || col >= COLS) return -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      return r;
    }
  }
  return -1;
}

export function checkConnect4Win(board: Connect4Board): Connect4WinningLine | null {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== null && p === board[r][c + 1] && p === board[r][c + 2] && p === board[r][c + 3]) {
        return {
          player: p,
          cells: [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }]
        };
      }
    }
  }

  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p !== null && p === board[r + 1][c] && p === board[r + 2][c] && p === board[r + 3][c]) {
        return {
          player: p,
          cells: [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }]
        };
      }
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== null && p === board[r + 1][c + 1] && p === board[r + 2][c + 2] && p === board[r + 3][c + 3]) {
        return {
          player: p,
          cells: [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }]
        };
      }
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const p = board[r][c];
      if (p !== null && p === board[r - 1][c + 1] && p === board[r - 2][c + 2] && p === board[r - 3][c + 3]) {
        return {
          player: p,
          cells: [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }]
        };
      }
    }
  }

  return null;
}

export function isConnect4Full(board: Connect4Board): boolean {
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) return false;
  }
  return true;
}

export function getValidColumns(board: Connect4Board): number[] {
  const valid: number[] = [];
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === null) {
      valid.push(c);
    }
  }
  return valid;
}

function evaluateWindow(window: Array<Connect4Player | null>, player: Connect4Player): number {
  const opponent: Connect4Player = player === 1 ? 2 : 1;
  let score = 0;

  const playerCount = window.filter(cell => cell === player).length;
  const emptyCount = window.filter(cell => cell === null).length;
  const oppCount = window.filter(cell => cell === opponent).length;

  if (playerCount === 4) {
    score += 50000;
  } else if (playerCount === 3 && emptyCount === 1) {
    score += 200;
  } else if (playerCount === 2 && emptyCount === 2) {
    score += 15;
  }

  if (oppCount === 4) {
    score -= 50000;
  } else if (oppCount === 3 && emptyCount === 1) {
    score -= 800;
  } else if (oppCount === 2 && emptyCount === 2) {
    score -= 25;
  }

  return score;
}

function scoreConnect4Position(board: Connect4Board, player: Connect4Player): number {
  let score = 0;

  // Center column priority (col 3)
  const centerCol = 3;
  let centerCount = 0;
  for (let r = 0; r < ROWS; r++) {
    if (board[r][centerCol] === player) centerCount++;
  }
  score += centerCount * 25;

  // Flanking center columns (2 and 4)
  for (let r = 0; r < ROWS; r++) {
    if (board[r][2] === player) score += 10;
    if (board[r][4] === player) score += 10;
  }

  // Horizontal windows
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], player);
    }
  }

  // Vertical windows
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], player);
    }
  }

  // Diagonal Down-Right
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], player);
    }
  }

  // Diagonal Up-Right
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]], player);
    }
  }

  return score;
}

function minimaxConnect4(
  board: Connect4Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): { score: number; col?: number } {
  const win = checkConnect4Win(board);
  if (win) {
    if (win.player === 2) return { score: 100000 + depth };
    if (win.player === 1) return { score: -100000 - depth };
  }

  const validCols = getValidColumns(board);
  if (validCols.length === 0 || depth === 0) {
    return { score: scoreConnect4Position(board, 2) };
  }

  // Order columns center-first: [3, 2, 4, 1, 5, 0, 6]
  const columnOrder = [3, 2, 4, 1, 5, 0, 6].filter(c => validCols.includes(c));

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestCol = columnOrder[0];

    for (const col of columnOrder) {
      const row = getAvailableRow(board, col);
      board[row][col] = 2;
      const result = minimaxConnect4(board, depth - 1, alpha, beta, false);
      board[row][col] = null;

      if (result.score > maxScore) {
        maxScore = result.score;
        bestCol = col;
      }
      alpha = Math.max(alpha, maxScore);
      if (alpha >= beta) break;
    }
    return { score: maxScore, col: bestCol };
  } else {
    let minScore = Infinity;
    let bestCol = columnOrder[0];

    for (const col of columnOrder) {
      const row = getAvailableRow(board, col);
      board[row][col] = 1;
      const result = minimaxConnect4(board, depth - 1, alpha, beta, true);
      board[row][col] = null;

      if (result.score < minScore) {
        minScore = result.score;
        bestCol = col;
      }
      beta = Math.min(beta, minScore);
      if (alpha >= beta) break;
    }
    return { score: minScore, col: bestCol };
  }
}

/**
 * Connect 4 Master AI.
 * Deep alpha-beta minimax search + suicide move avoidance + immediate win & block detection.
 */
export function getBestConnect4Move(board: Connect4Board): number {
  const validCols = getValidColumns(board);
  if (validCols.length === 0) return 0;

  const simBoard = cloneConnect4Board(board);

  // 1. Immediate Win: Can AI win this turn?
  for (const col of validCols) {
    const row = getAvailableRow(simBoard, col);
    simBoard[row][col] = 2;
    const win = checkConnect4Win(simBoard);
    simBoard[row][col] = null;
    if (win && win.player === 2) return col;
  }

  // 2. Immediate Block: Must AI block human 1-step win?
  for (const col of validCols) {
    const row = getAvailableRow(simBoard, col);
    simBoard[row][col] = 1;
    const win = checkConnect4Win(simBoard);
    simBoard[row][col] = null;
    if (win && win.player === 1) return col;
  }

  // 3. Filter out "suicide" columns:
  // (Moves that would allow opponent to play immediately above and win on next turn)
  const safeCols = validCols.filter(col => {
    const row = getAvailableRow(simBoard, col);
    if (row > 0) {
      // Simulate playing col
      simBoard[row][col] = 2;
      // If human plays row - 1 in same col, do they win?
      simBoard[row - 1][col] = 1;
      const win = checkConnect4Win(simBoard);
      simBoard[row - 1][col] = null;
      simBoard[row][col] = null;
      if (win && win.player === 1) {
        return false; // Suicide move!
      }
    }
    return true;
  });

  const candidates = safeCols.length > 0 ? safeCols : validCols;

  // 4. Run snappy minimax search (depth 4) on isolated clone
  const depth = 4;
  let bestScore = -Infinity;
  let bestCol = candidates[0];
  let alpha = -Infinity;
  const beta = Infinity;

  for (const col of candidates) {
    const row = getAvailableRow(simBoard, col);
    if (row === -1) continue;
    simBoard[row][col] = 2;
    const result = minimaxConnect4(simBoard, depth - 1, alpha, beta, false);
    simBoard[row][col] = null;

    if (result.score > bestScore) {
      bestScore = result.score;
      bestCol = col;
    }
    alpha = Math.max(alpha, bestScore);
  }

  return bestCol;
}
