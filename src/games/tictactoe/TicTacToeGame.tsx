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
  const [, setHistory] = useState<{ board: TTTBoard }[]>([]);

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
    }, 320);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, winningLine, isDraw, makeMove]);

  // Auto-refresh after 2.6s on loss or draw so the user can inspect the final board
  useEffect(() => {
    if ((winningLine && winningLine.winner === 'O') || isDraw) {
      const timer = setTimeout(() => {
        resetGame();
      }, 2600);
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
      return winningLine.winner === 'X' ? 'You Won!' : 'Bot Won!';
    }
    if (isDraw) return "Cat's Game (Draw)";
    return '';
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

      {/* Sketched Backing Sheet */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-3.5 sm:p-5 bg-[#faf6ee] hand-border-thick paper-note-shadow flex items-center justify-center select-none relative graph-paper-sketch">
        {/* Washi tape piece going OVER the top of the post-it note */}
        <div className="absolute -top-4 sm:-top-5 left-8 sm:left-12 w-28 sm:w-32 h-7 sm:h-8 bg-[#eed788]/95 washi-tape transform -rotate-2 z-30 shadow-md border-t border-b border-[#cca845]/50 pointer-events-none" />

        {/* 3x3 Grid of Light Yellow Post-it Squares */}
        <div className="grid grid-cols-3 grid-rows-3 gap-2.5 sm:gap-3.5 w-full h-full relative z-10">
          {board.map((cell, idx) => {
            const isWinner = isWinningCell(idx);
            const isClickable = cell === null && !winningLine && !isDraw && currentPlayer === 'X';

            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={!isClickable}
                className={`w-full h-full relative flex items-center justify-center touch-manipulation z-10 transition-all rounded-md sm:rounded-lg border-2 border-[#2c241c] shadow-[2px_2px_0px_#2c241c] ${
                  isWinner
                    ? 'bg-[#fde047] ring-2 ring-[#b83320] scale-[1.02]'
                    : 'bg-[#fef9c3]'
                } ${
                  isClickable
                    ? 'cursor-pointer hover:bg-[#fef08a] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#2c241c] active:translate-y-0 active:shadow-[1px_1px_0px_#2c241c]'
                    : 'cursor-default'
                }`}
                aria-label={`Grid cell ${idx}`}
              >
                {cell === 'X' && (
                  <svg
                    className={`w-14 h-14 sm:w-20 sm:h-20 aspect-square animate-stamp-slam ${
                      isWinner ? 'text-[#c0281b] drop-shadow-[0_2px_4px_rgba(192,40,27,0.4)]' : 'text-[#b83320]'
                    }`}
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  >
                    {/* Hand-drawn sketchy X with organic curves */}
                    <path d="M 18,22 Q 48,50 82,78" />
                    <path d="M 80,24 Q 52,52 18,76" />
                  </svg>
                )}

                {cell === 'O' && (
                  <svg
                    className={`w-14 h-14 sm:w-20 sm:h-20 aspect-square animate-stamp-slam ${
                      isWinner ? 'text-[#16436e] drop-shadow-[0_2px_4px_rgba(22,67,110,0.4)]' : 'text-[#1f4e78]'
                    }`}
                    viewBox="0 0 100 100"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  >
                    {/* Hand-drawn sketchy O loop with overlapping tail */}
                    <path d="M 50,16 C 72,16 86,30 84,54 C 82,76 66,86 48,84 C 28,82 14,68 16,46 C 18,26 34,16 54,16 C 58,16 64,18 68,22" />
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
