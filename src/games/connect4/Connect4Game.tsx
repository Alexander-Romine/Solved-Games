import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDown } from 'lucide-react';
import { GameStats } from '../../types';
import {
  Connect4Board,
  Connect4Player,
  Connect4WinningLine,
} from './types';
import {
  COLS,
  ROWS,
  createInitialConnect4Board,
  getAvailableRow,
  checkConnect4Win,
  isConnect4Full,
  getBestConnect4Move,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface Connect4GameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const Connect4Game: React.FC<Connect4GameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<Connect4Board>(createInitialConnect4Board);
  const [currentPlayer, setCurrentPlayer] = useState<Connect4Player>(1);
  const [winningLine, setWinningLine] = useState<Connect4WinningLine | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [lastPlacedCell, setLastPlacedCell] = useState<{ r: number; c: number } | null>(null);

  const isAiTurn = currentPlayer === 2;

  const resetGame = useCallback(() => {
    setBoard(createInitialConnect4Board());
    setCurrentPlayer(1);
    setWinningLine(null);
    setIsDraw(false);
    setHoveredCol(null);
    setLastPlacedCell(null);
  }, []);

  const dropPiece = useCallback((col: number, player: Connect4Player): boolean => {
    const row = getAvailableRow(board, col);
    if (row === -1) return false;

    sounds.playDrop();

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = player;
    setBoard(newBoard);
    setLastPlacedCell({ r: row, c: col });

    const win = checkConnect4Win(newBoard);
    if (win) {
      setWinningLine(win);
      if (win.player === 1) {
        sounds.playWin();
        onUpdateStats('win');
      } else {
        sounds.playDraw();
        onUpdateStats('loss');
      }
      return true;
    }

    if (isConnect4Full(newBoard)) {
      setIsDraw(true);
      sounds.playDraw();
      onUpdateStats('loss');
      return true;
    }

    setCurrentPlayer(player === 1 ? 2 : 1);
    return true;
  }, [board, onUpdateStats]);

  // AI Turn
  useEffect(() => {
    if (winningLine || isDraw || currentPlayer !== 2) {
      return;
    }

    const timer = setTimeout(() => {
      const bestCol = getBestConnect4Move(board);
      dropPiece(bestCol, 2);
    }, 280);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, winningLine, isDraw, dropPiece]);

  // Auto-refresh after ~1s on loss or draw
  useEffect(() => {
    if ((winningLine && winningLine.player === 2) || isDraw) {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [winningLine, isDraw, resetGame]);

  const handleColumnClick = (col: number) => {
    if (winningLine || isDraw || currentPlayer !== 1) {
      return;
    }
    if (getAvailableRow(board, col) === -1) {
      return;
    }
    dropPiece(col, 1);
  };

  const isCellWinning = (r: number, c: number) => {
    return winningLine?.cells.some(cell => cell.r === r && cell.c === c);
  };

  const getStatusText = () => {
    if (winningLine) {
      return winningLine.player === 1 ? 'You won' : 'Computer won';
    }
    if (isDraw) return 'Computer won';
    return currentPlayer === 1 ? 'Your Turn' : 'Thinking...';
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
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between select-none">
        {/* Column Hover Indicator / Drop Buttons Row */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full h-6 px-2 sm:px-3">
          {Array(COLS).fill(0).map((_, c) => {
            const colAvailable = getAvailableRow(board, c) !== -1;
            const isColHovered = hoveredCol === c && !winningLine && !isDraw && currentPlayer === 1 && colAvailable;
            const canClick = colAvailable && !winningLine && !isDraw && currentPlayer === 1;

            return (
              <button
                key={c}
                type="button"
                onClick={() => handleColumnClick(c)}
                onMouseEnter={() => setHoveredCol(c)}
                disabled={!canClick}
                aria-label={`Drop in column ${c + 1}`}
                className={`flex justify-center items-center h-full rounded-md transition-colors touch-manipulation ${
                  canClick ? 'cursor-pointer hover:bg-neutral-800/60' : 'cursor-default'
                }`}
              >
                {isColHovered && (
                  <ArrowDown className="w-4 h-4 animate-bounce text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.95)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Minimalist Matte Dark Chassis */}
        <div
          className="flex-1 w-full p-2 sm:p-3 rounded-2xl bg-[#1c1c26] border border-neutral-700 shadow-inner flex items-center justify-center relative"
          onMouseLeave={() => setHoveredCol(null)}
        >
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full h-full">
            {Array(COLS).fill(0).map((_, c) => {
              const availableRow = getAvailableRow(board, c);
              const colFull = availableRow === -1;
              const canClick = !colFull && !winningLine && !isDraw && currentPlayer === 1;
              const isColHovered = hoveredCol === c && canClick;

              return (
                <div
                  key={c}
                  role="button"
                  tabIndex={canClick ? 0 : -1}
                  onClick={() => handleColumnClick(c)}
                  onKeyDown={e => {
                    if (canClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleColumnClick(c);
                    }
                  }}
                  onMouseEnter={() => setHoveredCol(c)}
                  className={`flex flex-col justify-between h-full rounded-xl p-0.5 transition-colors touch-manipulation ${
                    canClick
                      ? 'cursor-pointer hover:bg-neutral-800/40'
                      : 'cursor-default'
                  }`}
                  aria-label={`Column ${c + 1}`}
                >
                  {Array(ROWS).fill(0).map((__, r) => {
                    const cell = board[r][c];
                    const isWinningDisc = isCellWinning(r, c);
                    const isNewest = lastPlacedCell?.r === r && lastPlacedCell?.c === c;
                    const isGhost = cell === null && isColHovered && availableRow === r;

                    return (
                      <div
                        key={`${r}-${c}`}
                        className="w-full aspect-square rounded-full bg-[#0b0b10] border border-neutral-700/70 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] relative flex items-center justify-center overflow-hidden"
                      >
                        {/* Ghost preview disc on hover */}
                        {isGhost && (
                          <div className="w-[88%] h-[88%] rounded-full border-2 border-dashed border-white/60 bg-white/15 animate-pulse pointer-events-none" />
                        )}

                        {/* Placed disc */}
                        {cell !== null && (
                          <div
                            className={`w-[88%] h-[88%] rounded-full shadow-md relative ${
                              isNewest ? 'animate-c4drop' : 'transition-transform duration-150'
                            } ${
                              cell === 1
                                ? 'bg-gradient-to-br from-white via-neutral-100 to-neutral-200 ring-2 ring-white/80 shadow-[0_2px_8px_rgba(255,255,255,0.3)]'
                                : 'bg-gradient-to-br from-neutral-750 via-neutral-900 to-black ring-2 ring-neutral-400 border border-neutral-400/40 shadow-[0_2px_8px_rgba(0,0,0,0.9)]'
                            } ${isWinningDisc ? 'ring-4 ring-white animate-pulse scale-105' : ''}`}
                          >
                            <div className="absolute inset-1 rounded-full border border-black/20 pointer-events-none" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
