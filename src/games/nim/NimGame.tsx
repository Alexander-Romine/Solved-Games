import React, { useState, useEffect, useCallback } from 'react';
import { GameStats } from '../../types';
import { NimPlayer } from './types';
import {
  INITIAL_NIM_HEAPS,
  getBestNimMove,
  isNimGameOver,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';
import { Minus, Plus } from 'lucide-react';

interface NimGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const NimGame: React.FC<NimGameProps> = ({ stats, onUpdateStats }) => {
  const [heaps, setHeaps] = useState<number[]>([...INITIAL_NIM_HEAPS]);
  const [currentPlayer, setCurrentPlayer] = useState<NimPlayer>(1);
  const [selectedHeapIndex, setSelectedHeapIndex] = useState<number | null>(null);
  const [stonesToTake, setStonesToTake] = useState<number>(1);
  const [winner, setWinner] = useState<NimPlayer | null>(null);
  const [, setHistory] = useState<{ heaps: number[] }[]>([]);

  const isAiTurn = currentPlayer === 2;

  const resetGame = useCallback(() => {
    setHeaps([...INITIAL_NIM_HEAPS]);
    setCurrentPlayer(1);
    setSelectedHeapIndex(null);
    setStonesToTake(1);
    setWinner(null);
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

  useEffect(() => {
    if (winner === 2) {
      const timer = setTimeout(() => {
        resetGame();
      }, 3800);
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
      return winner === 1 ? 'You Won!' : 'Bot Won!';
    }
    return '';
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

      {/* Ruled Scratchpad Sheet Container */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-3 sm:p-4 rounded-xl bg-[#fffdfa] hand-border-thick paper-note-shadow flex flex-col justify-between select-none relative">
        {/* Washi tape strip on top right */}
        <div className="absolute -top-3 right-10 w-20 h-5 bg-[#ecd58e]/90 transform rotate-3 shadow-xs border-t border-b border-[#c8b26e]/50 pointer-events-none z-20" />

        {/* 3 Heaps Arena */}
        <div className="flex-1 flex items-end justify-center gap-3 sm:gap-6 px-1 sm:px-2 py-2">
          {heaps.map((count, heapIdx) => {
            const isSelected = selectedHeapIndex === heapIdx;
            const isEmpty = count === 0;

            return (
              <div
                key={heapIdx}
                className={`flex-1 flex flex-col items-center gap-2 transition-transform ${
                  isEmpty ? 'opacity-30' : 'cursor-pointer hover:scale-102'
                }`}
                onClick={() => handleSelectHeap(heapIdx)}
              >
                <div
                  className={`w-full flex flex-col-reverse items-center gap-2 p-2 sm:p-3 rounded-lg h-44 sm:h-56 justify-start transition-all border-2 ${
                    isSelected
                      ? 'bg-[#fcedeb] border-[#b83320] ring-3 ring-[#b83320]/30 shadow-[2px_2px_0px_#b83320]'
                      : 'bg-[#faf6ee] border-[#2c241c] shadow-[2px_2px_0px_#2c241c]'
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
                        className={`w-full max-w-[84px] h-6 rounded-sm transition-all duration-150 flex items-center justify-between px-2 relative cursor-pointer border-2 touch-manipulation ${
                          isMarkedForRemoval
                            ? 'bg-[#b83320] border-[#5e160c] text-white shadow-xs scale-105'
                            : 'bg-[#f5e6ce] border-[#2c241c] hover:bg-[#edd8b6]'
                        }`}
                      >
                        {/* Sketched matchstick head */}
                        <div className={`w-3 h-3 rounded-full border border-black/40 ${isMarkedForRemoval ? 'bg-[#ffeedd]' : 'bg-[#c0281b]'}`} />
                        <div className="flex-1 h-1 bg-[#d8c3a5] mx-1 rounded-xs" />
                        <span className="text-[10px] font-mono font-bold opacity-60">#{stoneIdx + 1}</span>
                      </div>
                    );
                  })}
                  {isEmpty && (
                    <span className="text-xs text-[#8c7f70] font-['Caveat',cursive] text-base my-auto">Cleared!</span>
                  )}
                </div>

                <div className="text-center">
                  <div className="text-xs font-['Patrick_Hand',cursive] font-bold text-[#2c241c] bg-[#ede2ce] px-2.5 py-0.5 rounded border border-[#2c241c]">
                    Heap {heapIdx + 1}: {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Slip Bar */}
        <div className="h-13 border-t-2 border-dashed border-[#cfc1b0] pt-2 flex items-center justify-between px-1">
          {selectedHeapIndex !== null && !winner && currentPlayer === 1 ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-['Patrick_Hand',cursive] text-[#4f4337] font-bold">
                  Take Matches:
                </span>
                <div className="flex items-center gap-1.5 bg-[#f4ebd9] px-2 py-0.5 rounded-md border-2 border-[#2c241c]">
                  <button
                    onClick={() => setStonesToTake(Math.max(1, stonesToTake - 1))}
                    disabled={stonesToTake <= 1}
                    className="p-1 text-[#2c241c] hover:text-[#b83320] disabled:opacity-30 cursor-pointer touch-manipulation"
                    aria-label="Decrease matches"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-[#2c241c] tabular-nums text-sm min-w-[20px] text-center font-mono">
                    {stonesToTake}
                  </span>
                  <button
                    onClick={() => setStonesToTake(Math.min(heaps[selectedHeapIndex], stonesToTake + 1))}
                    disabled={stonesToTake >= heaps[selectedHeapIndex]}
                    className="p-1 text-[#2c241c] hover:text-[#b83320] disabled:opacity-30 cursor-pointer touch-manipulation"
                    aria-label="Increase matches"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedHeapIndex(null)}
                  className="px-2 py-1 text-xs font-['Patrick_Hand',cursive] text-[#5e5244] hover:text-black cursor-pointer touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeTake(selectedHeapIndex, stonesToTake, 1)}
                  className="px-3 py-1 text-xs font-['Patrick_Hand',cursive] font-bold text-white bg-[#b83320] hover:bg-[#992615] border-2 border-[#2c241c] rounded-md transition-transform cursor-pointer touch-manipulation shadow-[2px_2px_0px_#2c241c] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  Take {stonesToTake}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full text-center text-xs font-['Caveat',cursive] text-[#7a6d5d] text-base">
              {!winner && currentPlayer === 1 && '✏️ Tap a pile to pick how many matches to remove'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

