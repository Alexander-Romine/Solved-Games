import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';
import { GameStats } from '../../types';
import { NimPlayer } from './types';
import {
  INITIAL_NIM_HEAPS,
  getBestNimMove,
  isNimGameOver,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface NimGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const NimGame: React.FC<NimGameProps> = ({ stats, onUpdateStats }) => {
  const [heaps, setHeaps] = useState<number[]>([...INITIAL_NIM_HEAPS]);
  const [currentPlayer, setCurrentPlayer] = useState<NimPlayer>(1);
  const [winner, setWinner] = useState<NimPlayer | null>(null);
  const [history, setHistory] = useState<{ heaps: number[] }[]>([]);

  const isAiTurn = currentPlayer === 2;

  const [selectedHeapIndex, setSelectedHeapIndex] = useState<number | null>(null);
  const [stonesToTake, setStonesToTake] = useState<number>(1);

  const resetGame = useCallback(() => {
    setHeaps([...INITIAL_NIM_HEAPS]);
    setCurrentPlayer(1);
    setWinner(null);
    setSelectedHeapIndex(null);
    setStonesToTake(1);
    setHistory([]);
  }, []);

  const executeTake = useCallback((heapIndex: number, count: number, player: NimPlayer) => {
    if (heaps[heapIndex] < count || count <= 0) return;

    if (player === 1) {
      setHistory(prev => [...prev, { heaps: [...heaps] }]);
    }

    sounds.playCapture();

    const nextHeaps = [...heaps];
    nextHeaps[heapIndex] -= count;
    setHeaps(nextHeaps);
    setSelectedHeapIndex(null);
    setStonesToTake(1);

    if (isNimGameOver(nextHeaps)) {
      // Simplest rule: Normal play (player who takes the last stone wins)
      setWinner(player);

      if (player === 1) {
        sounds.playWin();
        onUpdateStats('win');
      } else {
        sounds.playDraw();
        onUpdateStats('loss');
      }
      return;
    }

    setCurrentPlayer(player === 1 ? 2 : 1);
  }, [heaps, onUpdateStats]);

  // AI Turn
  useEffect(() => {
    if (winner || currentPlayer !== 2) {
      return;
    }

    const timer = setTimeout(() => {
      const bestMove = getBestNimMove(heaps, 'normal');
      executeTake(bestMove.heapIndex, bestMove.count, 2);
    }, 450);

    return () => clearTimeout(timer);
  }, [currentPlayer, heaps, winner, executeTake]);

  // Auto-refresh after ~1s of losing
  useEffect(() => {
    if (winner === 2) {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [winner, resetGame]);

  const handleSelectHeap = (index: number) => {
    if (winner || currentPlayer !== 1 || heaps[index] === 0) {
      return;
    }
    sounds.playTap();
    setSelectedHeapIndex(index);
    setStonesToTake(1);
  };

  const getStatusText = () => {
    if (winner) {
      return winner === 1 ? 'You won' : 'Computer won';
    }
    return currentPlayer === 1 ? 'Your Turn' : 'Thinking...';
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center">
      <GameHeader
        stats={stats}
        statusText={getStatusText()}
        isGameOver={winner !== null}
        isAiTurn={isAiTurn}
        onResetGame={resetGame}
      />

      {/* Standardized Box Container (480px) */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex flex-col justify-between select-none">
        {/* Heaps Arena */}
        <div className="flex-1 flex items-end justify-center gap-3 sm:gap-8 px-1 sm:px-2 py-2">
          {heaps.map((count, heapIdx) => {
            const isSelected = selectedHeapIndex === heapIdx;
            const isEmpty = count === 0;

            return (
              <div
                key={heapIdx}
                className={`flex-1 flex flex-col items-center gap-2 transition-all ${
                  isEmpty ? 'opacity-30' : 'cursor-pointer'
                }`}
                onClick={() => handleSelectHeap(heapIdx)}
              >
                <div
                  className={`w-full flex flex-col-reverse items-center gap-2 p-2 sm:p-3 rounded-2xl h-44 sm:h-56 justify-start transition-all border ${
                    isSelected
                      ? 'bg-neutral-900 border-white ring-2 ring-white/60 shadow-[0_0_16px_rgba(255,255,255,0.3)]'
                      : 'bg-[#1c1c26] border-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {Array.from({ length: count }).map((_, stoneIdx) => {
                    const isMarkedForRemoval = isSelected && stoneIdx >= count - stonesToTake;
                    return (
                      <div
                        key={stoneIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isEmpty && !winner && currentPlayer === 1) {
                            setSelectedHeapIndex(heapIdx);
                            setStonesToTake(count - stoneIdx);
                            sounds.playPieceClick();
                          }
                        }}
                        className={`w-full max-w-[80px] h-5 sm:h-6 rounded-full transition-all duration-150 flex items-center justify-center relative cursor-pointer border touch-manipulation ${
                          isMarkedForRemoval
                            ? 'bg-neutral-800 border-2 border-white text-white ring-2 ring-white/70 scale-105'
                            : 'bg-gradient-to-r from-white via-neutral-100 to-neutral-200 border-2 border-white ring-1 ring-white/50 text-black shadow-sm hover:scale-105'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-black/40" />
                      </div>
                    );
                  })}
                  {isEmpty && (
                    <span className="text-xs text-neutral-400 font-mono my-auto">Empty</span>
                  )}
                </div>

                <div className="text-center font-mono">
                  <div className="text-xs font-bold text-neutral-300 tabular-nums">
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bar (Fixed Height to prevent any container jumping) */}
        <div className="h-12 border-t border-neutral-700/80 pt-2 flex items-center justify-between px-1">
          {selectedHeapIndex !== null && !winner && currentPlayer === 1 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-300 font-medium">
                  Take:
                </span>
                <div className="flex items-center gap-1.5 bg-[#1c1c26] px-2 py-1 rounded-lg border border-neutral-700">
                  <button
                    onClick={() => setStonesToTake(Math.max(1, stonesToTake - 1))}
                    disabled={stonesToTake <= 1}
                    className="p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer touch-manipulation"
                    aria-label="Decrease stones"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-white tabular-nums text-sm min-w-[20px] text-center font-mono">
                    {stonesToTake}
                  </span>
                  <button
                    onClick={() => setStonesToTake(Math.min(heaps[selectedHeapIndex], stonesToTake + 1))}
                    disabled={stonesToTake >= heaps[selectedHeapIndex]}
                    className="p-1 text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer touch-manipulation"
                    aria-label="Increase stones"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedHeapIndex(null)}
                  className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white cursor-pointer touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeTake(selectedHeapIndex, stonesToTake, 1)}
                  className="px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer touch-manipulation"
                >
                  Take {stonesToTake}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full text-center text-xs text-neutral-500">
              {!winner && currentPlayer === 1 && 'Select a heap to remove stones'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
