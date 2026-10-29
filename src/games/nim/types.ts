export type NimPlayer = 1 | 2; // 1: Player 1, 2: Player 2 / AI

export type NimRule = 'misere' | 'normal'; // misere: last takes loses; normal: last takes wins

export interface NimMove {
  heapIndex: number;
  count: number;
}
