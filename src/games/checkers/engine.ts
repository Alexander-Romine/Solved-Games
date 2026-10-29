import { CheckersBoard, CheckersCell, CheckersMove, CheckersPiece, CheckersPlayer, Position } from './types';

export function createInitialBoard(): CheckersBoard {
  const board: CheckersBoard = Array(8).fill(null).map(() => Array(8).fill(null));
  let idCounter = 1;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) {
          board[r][c] = { id: `p2_${idCounter++}`, player: 'p2', isKing: false };
        } else if (r > 4) {
          board[r][c] = { id: `p1_${idCounter++}`, player: 'p1', isKing: false };
        }
      }
    }
  }

  return board;
}

export function cloneBoard(board: CheckersBoard): CheckersBoard {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

export function isWithinBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getJumpsForPiece(board: CheckersBoard, r: number, c: number): CheckersMove[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  const directions: number[][] = [];

  if (piece.player === 'p1' || piece.isKing) {
    directions.push([-1, -1], [-1, 1]);
  }
  if (piece.player === 'p2' || piece.isKing) {
    directions.push([1, -1], [1, 1]);
  }

  for (const [dr, dc] of directions) {
    const jumpR = r + dr;
    const jumpC = c + dc;
    const landR = r + dr * 2;
    const landC = c + dc * 2;

    if (isWithinBoard(landR, landC) && isWithinBoard(jumpR, jumpC)) {
      const jumpedPiece = board[jumpR][jumpC];
      const landingSquare = board[landR][landC];

      if (jumpedPiece && jumpedPiece.player !== piece.player && landingSquare === null) {
        moves.push({
          from: { r, c },
          to: { r: landR, c: landC },
          isJump: true,
          captured: { r: jumpR, c: jumpC }
        });
      }
    }
  }

  return moves;
}

export function getSimpleMovesForPiece(board: CheckersBoard, r: number, c: number): CheckersMove[] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: CheckersMove[] = [];
  const directions: number[][] = [];

  if (piece.player === 'p1' || piece.isKing) {
    directions.push([-1, -1], [-1, 1]);
  }
  if (piece.player === 'p2' || piece.isKing) {
    directions.push([1, -1], [1, 1]);
  }

  for (const [dr, dc] of directions) {
    const nextR = r + dr;
    const nextC = c + dc;

    if (isWithinBoard(nextR, nextC) && board[nextR][nextC] === null) {
      moves.push({
        from: { r, c },
        to: { r: nextR, c: nextC },
        isJump: false
      });
    }
  }

  return moves;
}

export function getAllLegalMoves(
  board: CheckersBoard,
  player: CheckersPlayer,
  mandatoryJumps: boolean = true,
  continuationPiece?: Position | null
): CheckersMove[] {
  if (continuationPiece) {
    return getJumpsForPiece(board, continuationPiece.r, continuationPiece.c);
  }

  const allJumps: CheckersMove[] = [];
  const allSimples: CheckersMove[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell.player === player) {
        allJumps.push(...getJumpsForPiece(board, r, c));
        allSimples.push(...getSimpleMovesForPiece(board, r, c));
      }
    }
  }

  if (mandatoryJumps && allJumps.length > 0) {
    return allJumps;
  }

  return [...allJumps, ...allSimples];
}

export interface MoveResult {
  newBoard: CheckersBoard;
  crowned: boolean;
  canMultiJump: boolean;
  nextContinuation: Position | null;
}

export function executeMove(board: CheckersBoard, move: CheckersMove): MoveResult {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from.r][move.from.c]!;
  newBoard[move.from.r][move.from.c] = null;

  if (move.captured) {
    newBoard[move.captured.r][move.captured.c] = null;
  }

  let crowned = false;
  if (!piece.isKing) {
    if (piece.player === 'p1' && move.to.r === 0) {
      piece.isKing = true;
      crowned = true;
    } else if (piece.player === 'p2' && move.to.r === 7) {
      piece.isKing = true;
      crowned = true;
    }
  }

  newBoard[move.to.r][move.to.c] = piece;

  let canMultiJump = false;
  let nextContinuation: Position | null = null;

  if (move.isJump && !crowned) {
    const furtherJumps = getJumpsForPiece(newBoard, move.to.r, move.to.c);
    if (furtherJumps.length > 0) {
      canMultiJump = true;
      nextContinuation = { r: move.to.r, c: move.to.c };
    }
  }

  return { newBoard, crowned, canMultiJump, nextContinuation };
}

export function countPieces(board: CheckersBoard) {
  let p1Pieces = 0;
  let p1Kings = 0;
  let p2Pieces = 0;
  let p2Kings = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell) {
        if (cell.player === 'p1') {
          p1Pieces++;
          if (cell.isKing) p1Kings++;
        } else {
          p2Pieces++;
          if (cell.isKing) p2Kings++;
        }
      }
    }
  }

  return { p1Pieces, p1Kings, p2Pieces, p2Kings };
}

function evaluateBoard(board: CheckersBoard): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;

      let val = cell.isKing ? 65 : 25;

      if (!cell.isKing) {
        // Advancement bonus towards opponent baseline
        val += cell.player === 'p2' ? r * 3 : (7 - r) * 3;
        // Edge flank protection
        if (c === 0 || c === 7) val += 4;
        // Home back-row defense
        if (cell.player === 'p2' && r === 0) val += 6;
        if (cell.player === 'p1' && r === 7) val += 6;
      } else {
        // Central dominance for crowned kings
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) val += 10;
      }

      if (cell.player === 'p2') {
        score += val;
      } else {
        score -= val;
      }
    }
  }

  return score;
}

function minimax(
  board: CheckersBoard,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  mandatoryJumps: boolean
): number {
  const player = isMaximizing ? 'p2' : 'p1';
  const legalMoves = getAllLegalMoves(board, player, mandatoryJumps);

  if (legalMoves.length === 0) {
    return isMaximizing ? -20000 : 20000;
  }

  if (depth === 0) {
    return evaluateBoard(board);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const { newBoard, canMultiJump, nextContinuation } = executeMove(board, move);
      let evaluation: number;

      if (canMultiJump && nextContinuation) {
        evaluation = minimax(newBoard, depth - 1, alpha, beta, true, mandatoryJumps);
      } else {
        evaluation = minimax(newBoard, depth - 1, alpha, beta, false, mandatoryJumps);
      }

      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const { newBoard, canMultiJump, nextContinuation } = executeMove(board, move);
      let evaluation: number;

      if (canMultiJump && nextContinuation) {
        evaluation = minimax(newBoard, depth - 1, alpha, beta, false, mandatoryJumps);
      } else {
        evaluation = minimax(newBoard, depth - 1, alpha, beta, true, mandatoryJumps);
      }

      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

/**
 * Unbeatable Checkers AI
 */
export function getBestCheckersMove(
  board: CheckersBoard,
  player: CheckersPlayer,
  mandatoryJumps: boolean = true,
  continuationPiece?: Position | null
): CheckersMove | null {
  const legalMoves = getAllLegalMoves(board, player, mandatoryJumps, continuationPiece);
  if (legalMoves.length === 0) return null;

  const depth = 5;
  let bestScore = player === 'p2' ? -Infinity : Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    const { newBoard, canMultiJump, nextContinuation } = executeMove(board, move);
    let score: number;

    if (canMultiJump && nextContinuation) {
      score = minimax(newBoard, depth - 1, -Infinity, Infinity, player === 'p2', mandatoryJumps);
    } else {
      score = minimax(newBoard, depth - 1, -Infinity, Infinity, player !== 'p2', mandatoryJumps);
    }

    if (player === 'p2') {
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  return bestMove;
}
