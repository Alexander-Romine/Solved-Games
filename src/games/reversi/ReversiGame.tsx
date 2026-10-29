import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameStats } from '../../types';
import { GameHeader } from '../../components/GameHeader';
import { sounds } from '../../utils/sound';
import {
  ReversiBoard,
  ReversiMove,
  ReversiPlayer,
} from './types';
import {
  BOARD_SIZE,
  applyMove,
  countDiscs,
  createInitialBoard,
  getBestReversiMove,
  getLegalMoves,
} from './engine';

interface ReversiGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const ReversiGame: React.FC<ReversiGameProps> = ({
  stats,
  onUpdateStats,
}) => {
  const [board, setBoard] = useState<ReversiBoard>(() => createInitialBoard());
  const [currentPlayer, setCurrentPlayer] = useState<ReversiPlayer>('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<ReversiPlayer | 'tie' | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [hoveredMove, setHoveredMove] = useState<ReversiMove | null>(null);
  const [lastPlacedCell, setLastPlacedCell] = useState<{ r: number; c: number } | null>(null);

  // Player is White; Computer is Black
  const isAiTurn = currentPlayer === 'black' && !gameOver;

  const playerLegalMoves = useMemo(() => {
    if (gameOver || currentPlayer !== 'white') return [];
    return getLegalMoves(board, 'white');
  }, [board, currentPlayer, gameOver]);

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer('white');
    setGameOver(false);
    setWinner(null);
    setPassNotice(null);
    setHoveredMove(null);
    setLastPlacedCell(null);
  }, []);

  const finishGame = useCallback((finalBoard: ReversiBoard) => {
    const finalScore = countDiscs(finalBoard);
    let resultWinner: ReversiPlayer | 'tie';

    if (finalScore.white > finalScore.black) {
      resultWinner = 'white';
      sounds.playWin();
      onUpdateStats('win');
    } else if (finalScore.black > finalScore.white) {
      resultWinner = 'black';
      sounds.playDraw();
      onUpdateStats('loss');
    } else {
      resultWinner = 'tie';
      sounds.playDraw();
      onUpdateStats('loss');
    }

    setGameOver(true);
    setWinner(resultWinner);
  }, [onUpdateStats]);

  const makeMove = useCallback((move: ReversiMove, player: ReversiPlayer) => {
    const nextBoard = applyMove(board, move, player);
    setBoard(nextBoard);
    setLastPlacedCell({ r: move.row, c: move.col });
    setHoveredMove(null);
    sounds.playTap();

    const nextPlayer: ReversiPlayer = player === 'white' ? 'black' : 'white';
    const nextLegalMoves = getLegalMoves(nextBoard, nextPlayer);

    if (nextLegalMoves.length > 0) {
      // Normal strict alternating turn
      setCurrentPlayer(nextPlayer);
      setPassNotice(null);
    } else {
      // Next player has no moves; only then is their turn forced to pass
      const currentCanMoveAgain = getLegalMoves(nextBoard, player);
      if (currentCanMoveAgain.length > 0) {
        setPassNotice(`${nextPlayer === 'black' ? 'Computer' : 'You'} had no moves • Turn passed`);
        // Turn stays with the same player
      } else {
        // Neither player has legal moves; game over
        finishGame(nextBoard);
      }
    }
  }, [board, finishGame]);

  // AI Turn effect (Computer is Black)
  useEffect(() => {
    if (!isAiTurn || gameOver) return;

    const timer = setTimeout(() => {
      const bestMove = getBestReversiMove(board, 'black');
      if (bestMove) {
        makeMove(bestMove, 'black');
      } else {
        // AI has no moves
        const humanMoves = getLegalMoves(board, 'white');
        if (humanMoves.length > 0) {
          setPassNotice('Computer had no moves • Turn passed to you');
          setCurrentPlayer('white');
        } else {
          finishGame(board);
        }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [isAiTurn, gameOver, board, makeMove, finishGame]);

  // Auto-refresh after ~1.2s on loss or draw (Loss is when Computer Black wins)
  useEffect(() => {
    if (gameOver && (winner === 'black' || winner === 'tie')) {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameOver, winner, resetGame]);

  const handleCellClick = (row: number, col: number) => {
    if (isAiTurn || gameOver || currentPlayer !== 'white') return;
    const legalMove = playerLegalMoves.find(m => m.row === row && m.col === col);
    if (legalMove) {
      makeMove(legalMove, 'white');
    }
  };

  const getStatusText = () => {
    if (gameOver) {
      if (winner === 'tie') return 'Computer won';
      return winner === 'white' ? 'You won' : 'Computer won';
    }
    if (passNotice) return passNotice;
    return currentPlayer === 'white'
      ? 'Your Turn'
      : 'Thinking...';
  };

  const isFlippedByHover = (r: number, c: number) => {
    return hoveredMove?.flipped.some(f => f.row === r && f.col === c) ?? false;
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center">
      <GameHeader
        stats={stats}
        statusText={getStatusText()}
        isGameOver={gameOver}
        isAiTurn={isAiTurn}
        onResetGame={resetGame}
      />

      {/* Standardized Box Container (480px) */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-center select-none">
        {/* Monochrome board chassis */}
        <div className="w-full h-full p-2 sm:p-2.5 bg-[#181822] border border-neutral-700 rounded-2xl shadow-inner grid grid-cols-8 grid-rows-8 gap-1 sm:gap-1.5 relative">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const legalMove = playerLegalMoves.find(m => m.row === r && m.col === c);
              const isHovered = hoveredMove?.row === r && hoveredMove?.col === c;
              const willFlip = isFlippedByHover(r, c);
              const isLast = lastPlacedCell?.r === r && lastPlacedCell?.c === c;

              // Classic Othello star points at (2,2), (2,5), (5,2), (5,5)
              const isStarPoint = (r === 2 || r === 5) && (c === 2 || c === 5);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => {
                    if (legalMove) setHoveredMove(legalMove);
                  }}
                  onMouseLeave={() => {
                    if (hoveredMove?.row === r && hoveredMove?.col === c) {
                      setHoveredMove(null);
                    }
                  }}
                  disabled={!legalMove || isAiTurn || gameOver}
                  className={`relative rounded-md flex items-center justify-center transition-all touch-manipulation ${
                    cell === null && legalMove && !isAiTurn
                      ? 'cursor-pointer hover:bg-neutral-700/60 hover:border-neutral-500'
                      : 'cursor-default'
                  } bg-[#23232f] border border-neutral-700/70 shadow-sm`}
                  aria-label={`Square ${r + 1}, ${c + 1}`}
                >
                  {/* Star point reference dot */}
                  {isStarPoint && cell === null && !legalMove && (
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 pointer-events-none" />
                  )}

                  {/* Discs */}
                  {cell !== null && (
                    <div
                      className={`w-[84%] h-[84%] rounded-full transition-transform duration-200 flex items-center justify-center ${
                        cell === 'black'
                          ? 'bg-gradient-to-br from-neutral-750 via-neutral-900 to-black border-2 border-neutral-400 ring-1 ring-white/30 shadow-[0_3px_8px_rgba(0,0,0,0.9)] text-neutral-300'
                          : 'bg-gradient-to-br from-white via-neutral-100 to-neutral-200 border-2 border-white ring-1 ring-white/60 shadow-[0_3px_8px_rgba(0,0,0,0.7)] text-neutral-800'
                      } ${willFlip ? 'scale-105 ring-2 ring-white/90 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''} ${
                        isLast ? 'ring-2 ring-white/80' : ''
                      }`}
                    >
                      {/* Subtle concentric disc bevel */}
                      <div
                        className={`w-[70%] h-[70%] rounded-full border ${
                          cell === 'black'
                            ? 'border-neutral-500/50 bg-neutral-900/50'
                            : 'border-neutral-300/60 bg-neutral-200/50'
                        }`}
                      />
                    </div>
                  )}

                  {/* Legal move subtle ghost indicator */}
                  {cell === null && legalMove && !isAiTurn && (
                    <div className="relative flex items-center justify-center">
                      <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white/35 border border-white/50 shadow-[0_0_6px_rgba(255,255,255,0.3)] transition-all group-hover:scale-125" />
                      {isHovered && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-white bg-neutral-900 px-1 rounded border border-neutral-700 z-20 pointer-events-none whitespace-nowrap shadow-md">
                          +{legalMove.flipped.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
