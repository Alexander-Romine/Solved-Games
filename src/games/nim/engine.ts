import { NimMove, NimPlayer, NimRule } from './types';

export const INITIAL_NIM_HEAPS = [3, 4, 5];

export function isNimGameOver(heaps: number[]): boolean {
  return heaps.every(h => h === 0);
}

/**
 * Calculates Nim-Sum (bitwise XOR of all heap sizes)
 */
export function calculateNimSum(heaps: number[]): number {
  return heaps.reduce((acc, count) => acc ^ count, 0);
}

/**
 * Determines winner when game ends based on active rule and who took the last stone
 */
export function getNimWinner(lastPlayer: NimPlayer, rule: NimRule): NimPlayer {
  if (rule === 'normal') {
    return lastPlayer;
  } else {
    return lastPlayer === 1 ? 2 : 1;
  }
}

/**
 * 100% Mathematically Flawless AI Move using Bouton's Theorem.
 * Never blunders. If a winning move exists, it is always chosen.
 */
export function getBestNimMove(heaps: number[], rule: NimRule): NimMove {
  const nonZeroIndices = heaps
    .map((count, index) => ({ count, index }))
    .filter(item => item.count > 0);

  if (nonZeroIndices.length === 0) {
    return { heapIndex: 0, count: 1 };
  }

  // Misère strategy near endgame:
  if (rule === 'misere') {
    const heapsGreaterThanOne = nonZeroIndices.filter(item => item.count > 1);

    if (heapsGreaterThanOne.length === 1) {
      const bigHeap = heapsGreaterThanOne[0];
      const otherHeapsOfOne = nonZeroIndices.filter(item => item.count === 1).length;

      const targetSize = otherHeapsOfOne % 2 === 0 ? 1 : 0;
      return {
        heapIndex: bigHeap.index,
        count: bigHeap.count - targetSize
      };
    } else if (heapsGreaterThanOne.length === 0) {
      return {
        heapIndex: nonZeroIndices[0].index,
        count: 1
      };
    }
  }

  // General Bouton's Theorem:
  const nimSum = calculateNimSum(heaps);

  if (nimSum !== 0) {
    for (const item of nonZeroIndices) {
      const targetHeapSize = item.count ^ nimSum;
      if (targetHeapSize < item.count) {
        if (rule === 'misere') {
          const simulated = [...heaps];
          simulated[item.index] = targetHeapSize;
          const greaterThanOne = simulated.filter(h => h > 1).length;
          if (greaterThanOne === 0) {
            const ones = simulated.filter(h => h === 1).length;
            if (ones % 2 === 0) {
              const adjustedTarget = targetHeapSize === 0 ? 1 : 0;
              return {
                heapIndex: item.index,
                count: item.count - adjustedTarget
              };
            }
          }
        }

        return {
          heapIndex: item.index,
          count: item.count - targetHeapSize
        };
      }
    }
  }

  // Defensive stall if already at 0
  const sorted = [...nonZeroIndices].sort((a, b) => b.count - a.count);
  return {
    heapIndex: sorted[0].index,
    count: 1
  };
}
