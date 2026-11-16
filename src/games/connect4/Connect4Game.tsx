import React, { useState, useEffect, useCallback } from 'react';
import { GameStats } from '../../types';
import {
  Connect4Board,
  Connect4Player,
  WinningLine,
} from './types';
import {
  checkConnect4Win,
  createInitialConnect4Board,
  getAvailableRow,
  getBestConnect4Move,
  isConnect4Full,
  ROWS,
  COLS,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';
import { ArrowDown } from 'lucide-react';

interface Connect4GameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const Connect4Game: React.FC<Connect4GameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<Connect4Board>(createInitialConnect4Board);
  const [currentPlayer, setCurrentPlayer] = useState<Connect4Player>(1);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
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
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, winningLine, isDraw, dropPiece]);

  // Auto-refresh after ~3.8s on loss or draw so the user can inspect the winning 4-in-a-row
  useEffect(() => {
    if ((winningLine && winningLine.player === 2) || isDraw) {
      const timer = setTimeout(() => {
        resetGame();
      }, 2600);
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
      return winningLine.player === 1 ? 'You Won!' : 'Bot Won!';
    }
    if (isDraw) return 'Draw (Grid Full)';
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

      {/* Cardboard Punch-Grid Chassis */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-xl bg-[#fffdfa] hand-border-thick paper-note-shadow flex flex-col items-center justify-between select-none relative">
        {/* Washi tape on top right */}
        <div className="absolute -top-3 right-8 w-18 h-5 bg-[#a9d4bd]/90 transform rotate-3 shadow-xs border-t border-b border-[#84b39a]/60 pointer-events-none z-20" />

        {/* Column Drop Indicator Arrow Buttons */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full h-7 px-2 sm:px-3">
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
                  canClick ? 'cursor-pointer hover:bg-[#ebd9bd]/30' : 'cursor-default'
                }`}
              >
                {isColHovered && (
                  <ArrowDown className="w-4 h-4 animate-bounce text-[#b83320] drop-shadow-[0_1px_1px_rgba(184,51,32,0.4)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Thick Cut-out Chipboard Grid */}
        <div
          className="flex-1 w-full p-2 sm:p-3 rounded-lg bg-[#ede2ce] border-2 border-[#332b23] shadow-inner flex items-center justify-center relative"
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
                  className={`flex flex-col justify-between h-full rounded-lg p-0.5 transition-colors touch-manipulation ${
                    canClick
                      ? 'cursor-pointer hover:bg-[#d9cbb2]/60'
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
                        className="w-full aspect-square rounded-full bg-[#2a241e] border-2 border-[#1c1813] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] relative flex items-center justify-center overflow-hidden"
                      >
                        {/* Ghost disc preview on hover */}
                        {isGhost && (
                          <div className="w-[88%] h-[88%] rounded-full border-2 border-dashed border-[#b83320] bg-[#b83320]/20 animate-pulse pointer-events-none" />
                        )}

                        {/* Stamped Felt Marker Token */}
                        {cell !== null && (
                          <div
                            className={`w-[88%] h-[88%] rounded-full shadow-md relative ${
                              isNewest ? 'animate-c4drop-hand' : 'transition-transform duration-150'
                            } ${
                              cell === 1
                                ? 'bg-[#c23623] border-2 border-[#e67363] text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                                : 'bg-[#1f4e78] border-2 border-[#5a8bb8] text-white shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                            } ${isWinningDisc ? 'ring-4 ring-[#f59e0b] animate-pulse scale-105' : ''}`}
                          >
                            {/* Hand-drawn sketchy white glint */}
                            <div className="absolute top-1 left-1.5 w-2 h-1 rounded-full bg-white/40 transform -rotate-45 pointer-events-none" />
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


