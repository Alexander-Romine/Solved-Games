import React, { useState, useEffect, useCallback } from 'react';
import { GameStats } from '../../types';
import {
  TTTBoard,
  TTTPlayer,
  TTTWinningLine,
} from './types';
import {
  checkTTTWin,
  createInitialTTTBoard,
  getBestTTTMove,
  isTTTFull,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface TicTacToeGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<TTTBoard>(createInitialTTTBoard);
  const [currentPlayer, setCurrentPlayer] = useState<TTTPlayer>('X');
  const [winningLine, setWinningLine] = useState<TTTWinningLine | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [history, setHistory] = useState<{ board: TTTBoard }[]>([]);

  const isAiTurn = currentPlayer === 'O';

  const resetGame = useCallback(() => {
    setBoard(createInitialTTTBoard());
    setCurrentPlayer('X');
    setWinningLine(null);
    setIsDraw(false);
    setHistory([]);
  }, []);

  const makeMove = useCallback((idx: number, player: TTTPlayer) => {
    if (board[idx] !== null) return;

    if (player === 'X') {
      setHistory(prev => [...prev, { board: [...board] }]);
    }
    sounds.playPieceClick();

    const newBoard = [...board];
    newBoard[idx] = player;
    setBoard(newBoard);

    const win = checkTTTWin(newBoard);
    if (win) {
      setWinningLine(win);
      if (win.winner === 'X') {
        sounds.playWin();
        onUpdateStats('win');
      } else {
        sounds.playDraw();
        onUpdateStats('loss');
      }
      return;
    }

    if (isTTTFull(newBoard)) {
      setIsDraw(true);
      sounds.playDraw();
      onUpdateStats('loss');
      return;
    }

    setCurrentPlayer(player === 'X' ? 'O' : 'X');
  }, [board, onUpdateStats]);

  // AI Turn
  useEffect(() => {
    if (winningLine || isDraw || currentPlayer !== 'O') {
      return;
    }

    const timer = setTimeout(() => {
      const bestMove = getBestTTTMove(board);
      makeMove(bestMove, 'O');
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, winningLine, isDraw, makeMove]);

  // Auto-refresh after ~1s on loss or draw
  useEffect(() => {
    if ((winningLine && winningLine.winner === 'O') || isDraw) {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [winningLine, isDraw, resetGame]);

  const handleCellClick = (idx: number) => {
    if (winningLine || isDraw || currentPlayer !== 'X' || board[idx] !== null) {
      return;
    }
    makeMove(idx, 'X');
  };

  const isWinningCell = (idx: number) => winningLine?.indices.includes(idx);

  const getStatusText = () => {
    if (winningLine) {
      return winningLine.winner === 'X' ? 'You won' : 'Computer won';
    }
    if (isDraw) return 'Computer won';
    return currentPlayer === 'X' ? 'Your Turn' : 'Thinking...';
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center">
      <GameHeader
        stats={stats}
        statusText={getStatusText()}
        isGameOver={winningLine !== null || isDraw}
        isAiTurn={isAiTurn}
        onResetGame={resetGame}
      />

      {/* Standardized Box Container (480px) */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-3 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-center select-none">
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3 w-full h-full">
          {board.map((cell, idx) => {
            const isWinner = isWinningCell(idx);
            const isClickable = cell === null && !winningLine && !isDraw && currentPlayer === 'X';

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!isClickable}
                className={`w-full h-full relative rounded-2xl flex items-center justify-center transition-colors border overflow-hidden touch-manipulation ${
                  isWinner
                    ? 'bg-neutral-800 border-white shadow-[0_0_14px_rgba(255,255,255,0.4)]'
                    : 'bg-[#1c1c26] border-neutral-700/70'
                } ${
                  isClickable
                    ? 'cursor-pointer hover:bg-[#252533] hover:border-neutral-500'
                    : 'cursor-default'
                }`}
                aria-label={`Cell ${idx}`}
              >
                {cell === 'X' && (
                  <svg
                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square ${
                      isWinner ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]' : 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="4" y1="4" x2="20" y2="20" />
                    <line x1="20" y1="4" x2="4" y2="20" />
                  </svg>
                )}

                {cell === 'O' && (
                  <svg
                    className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 aspect-square ${
                      isWinner ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]' : 'text-neutral-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
