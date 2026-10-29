import { MancalaPlayer, MancalaState } from './types';

export const P1_PITS = [0, 1, 2, 3, 4, 5];
export const P1_STORE = 6;
export const P2_PITS = [7, 8, 9, 10, 11, 12];
export const P2_STORE = 13;

export function createInitialMancalaState(): MancalaState {
  const pits = [
    4, 4, 4, 4, 4, 4, // 0..5 (P1)
    0,                // 6 (P1 Kalah)
    4, 4, 4, 4, 4, 4, // 7..12 (P2)
    0                 // 13 (P2 Kalah)
  ];

  return {
    pits,
    currentPlayer: 1,
    gameOver: false,
    winner: null,
    hadExtraTurn: false,
    lastCapturedCount: 0
  };
}

export function isValidMancalaMove(state: MancalaState, pitIndex: number): boolean {
  if (state.gameOver) return false;
  const isP1 = state.currentPlayer === 1;

  if (isP1) {
    if (pitIndex < 0 || pitIndex > 5) return false;
  } else {
    if (pitIndex < 7 || pitIndex > 12) return false;
  }

  return state.pits[pitIndex] > 0;
}

export function getLegalMancalaMoves(state: MancalaState): number[] {
  if (state.gameOver) return [];
  const validPits = state.currentPlayer === 1 ? P1_PITS : P2_PITS;
  return validPits.filter(p => state.pits[p] > 0);
}

export function playMancalaMove(state: MancalaState, pitIndex: number): MancalaState {
  if (!isValidMancalaMove(state, pitIndex)) return state;

  const pits = [...state.pits];
  const player = state.currentPlayer;
  let seeds = pits[pitIndex];
  pits[pitIndex] = 0;

  let currentPit = pitIndex;
  const ownStore = player === 1 ? P1_STORE : P2_STORE;
  const oppStore = player === 1 ? P2_STORE : P1_STORE;

  while (seeds > 0) {
    currentPit = (currentPit + 1) % 14;
    if (currentPit === oppStore) {
      continue;
    }
    pits[currentPit]++;
    seeds--;
  }

  let extraTurn = false;
  let capturedCount = 0;

  if (currentPit === ownStore) {
    extraTurn = true;
  } else {
    const isOwnSide = player === 1
      ? (currentPit >= 0 && currentPit <= 5)
      : (currentPit >= 7 && currentPit <= 12);

    if (isOwnSide && pits[currentPit] === 1) {
      const oppositePit = 12 - currentPit;
      if (pits[oppositePit] > 0) {
        capturedCount = pits[oppositePit] + 1;
        pits[ownStore] += capturedCount;
        pits[currentPit] = 0;
        pits[oppositePit] = 0;
      }
    }
  }

  const p1Empty = P1_PITS.every(p => pits[p] === 0);
  const p2Empty = P2_PITS.every(p => pits[p] === 0);

  if (p1Empty || p2Empty) {
    for (const p of P1_PITS) {
      pits[P1_STORE] += pits[p];
      pits[p] = 0;
    }
    for (const p of P2_PITS) {
      pits[P2_STORE] += pits[p];
      pits[p] = 0;
    }

    let winner: MancalaPlayer | 'tie' = 'tie';
    if (pits[P1_STORE] > pits[P2_STORE]) {
      winner = 1;
    } else if (pits[P2_STORE] > pits[P1_STORE]) {
      winner = 2;
    }

    return {
      pits,
      currentPlayer: player,
      gameOver: true,
      winner,
      hadExtraTurn: false,
      lastCapturedCount: capturedCount,
      lastActionMessage: winner === 'tie' ? 'Game ended in a tie!' : `AI wins with ${pits[P2_STORE]} stones!`
    };
  }

  const nextPlayer: MancalaPlayer = extraTurn ? player : (player === 1 ? 2 : 1);

  return {
    pits,
    currentPlayer: nextPlayer,
    gameOver: false,
    winner: null,
    hadExtraTurn: extraTurn,
    lastCapturedCount: capturedCount,
    lastActionMessage: extraTurn
      ? 'Bonus Turn! AI landed in its store.'
      : (capturedCount > 0 ? `AI captured ${capturedCount} stones!` : undefined)
  };
}

/**
 * Advanced evaluation function for Mancala AI (Player 2)
 */
function evaluateMancala(state: MancalaState): number {
  if (state.gameOver) {
    if (state.winner === 2) return 50000 + (state.pits[P2_STORE] - state.pits[P1_STORE]) * 100;
    if (state.winner === 1) return -50000 + (state.pits[P2_STORE] - state.pits[P1_STORE]) * 100;
    return 0;
  }

  // Heavy Kalah differential
  let score = (state.pits[P2_STORE] - state.pits[P1_STORE]) * 40;

  // Seeds in active player pits
  for (let i = 7; i <= 12; i++) {
    score += state.pits[i] * 3;
    // Pits that can score directly into store
    if (state.pits[i] === P2_STORE - i) {
      score += 15; // Potential free turn
    }
  }

  // Punish opponent pits with threat of capture
  for (let i = 0; i <= 5; i++) {
    score -= state.pits[i] * 3;
    if (state.pits[i] === P1_STORE - i) {
      score -= 15;
    }
  }

  return score;
}

function minimaxMancala(
  state: MancalaState,
  depth: number,
  alpha: number,
  beta: number
): { score: number; move?: number } {
  if (state.gameOver || depth === 0) {
    return { score: evaluateMancala(state) };
  }

  const moves = getLegalMancalaMoves(state);
  if (moves.length === 0) {
    return { score: evaluateMancala(state) };
  }

  const isP2 = state.currentPlayer === 2;

  if (isP2) {
    let maxScore = -Infinity;
    let bestMove = moves[0];

    for (const move of moves) {
      const nextState = playMancalaMove(state, move);
      const d = nextState.currentPlayer === 2 ? depth : depth - 1;
      const result = minimaxMancala(nextState, d, alpha, beta);

      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, maxScore);
      if (alpha >= beta) break;
    }
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    let bestMove = moves[0];

    for (const move of moves) {
      const nextState = playMancalaMove(state, move);
      const d = nextState.currentPlayer === 1 ? depth : depth - 1;
      const result = minimaxMancala(nextState, d, alpha, beta);

      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
      beta = Math.min(beta, minScore);
      if (alpha >= beta) break;
    }
    return { score: minScore, move: bestMove };
  }
}

/**
 * Flawless Mancala move calculation
 */
export function getBestMancalaMove(state: MancalaState): number {
  const legalMoves = getLegalMancalaMoves(state);
  if (legalMoves.length === 0) return 7;

  // 1. Prioritize guaranteed free-turn moves that immediately lead to extra sow
  const freeTurnMoves = legalMoves.filter(pit => {
    const seeds = state.pits[pit];
    const dist = P2_STORE - pit;
    return seeds === dist || (seeds > 13 && seeds % 13 === dist);
  });

  if (freeTurnMoves.length > 0) {
    // If multiple free turns exist, evaluate which one gives highest subsequent score
    let bestFtMove = freeTurnMoves[0];
    let bestFtScore = -Infinity;
    for (const ft of freeTurnMoves) {
      const nextSt = playMancalaMove(state, ft);
      const res = minimaxMancala(nextSt, 5, -Infinity, Infinity);
      if (res.score > bestFtScore) {
        bestFtScore = res.score;
        bestFtMove = ft;
      }
    }
    return bestFtMove;
  }

  // 2. Full deep minimax search (depth 6)
  const result = minimaxMancala(state, 6, -Infinity, Infinity);
  return result.move !== undefined ? result.move : legalMoves[0];
}
