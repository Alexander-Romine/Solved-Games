import React, { useState, useEffect, useCallback } from 'react';
import { GameStats } from '../../types';
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
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface ReversiGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const ReversiGame: React.FC<ReversiGameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<ReversiBoard>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<ReversiPlayer>('white');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<ReversiPlayer | 'tie' | null>(null);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const [hoveredMove, setHoveredMove] = useState<ReversiMove | null>(null);
  const [lastPlacedCell, setLastPlacedCell] = useState<{ r: number; c: number } | null>(null);

  const isAiTurn = currentPlayer === 'black';
  const playerLegalMoves = !isAiTurn && !gameOver ? getLegalMoves(board, 'white') : [];

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
      setCurrentPlayer(nextPlayer);
      setPassNotice(null);
    } else {
      const currentCanMoveAgain = getLegalMoves(nextBoard, player);
      if (currentCanMoveAgain.length > 0) {
        setPassNotice(`${nextPlayer === 'black' ? 'Bot' : 'You'} had no moves • Turn passed`);
      } else {
        finishGame(nextBoard);
      }
    }
  }, [board, finishGame]);

  // AI Turn effect
  useEffect(() => {
    if (!isAiTurn || gameOver) return;

    const timer = setTimeout(() => {
      const bestMove = getBestReversiMove(board, 'black');
      if (bestMove) {
        makeMove(bestMove, 'black');
      } else {
        const humanMoves = getLegalMoves(board, 'white');
        if (humanMoves.length > 0) {
          setPassNotice('Bot had no moves • Turn passed to you');
          setCurrentPlayer('white');
        } else {
          finishGame(board);
        }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [isAiTurn, gameOver, board, makeMove, finishGame]);

  useEffect(() => {
    if (gameOver && (winner === 'black' || winner === 'tie')) {
      const timer = setTimeout(() => {
        resetGame();
      }, 3800);
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
      if (winner === 'tie') return 'Draw Match';
      return winner === 'white' ? 'You Won!' : 'Bot Won!';
    }
    return '';
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

      {/* Sketched Graph Paper Reversi Board Container */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-xl bg-[#fffdfa] hand-border-thick paper-note-shadow flex items-center justify-center select-none relative">
        {/* Washi tape strip on top left */}
        <div className="absolute -top-3 left-10 w-20 h-5 bg-[#a5cde3]/90 transform -rotate-2 shadow-xs border-t border-b border-[#7da9c2]/60 pointer-events-none z-20" />

        <div className="w-full h-full p-2 bg-[#f4ebd9] border-2 border-[#2c241c] rounded-lg shadow-inner grid grid-cols-8 grid-rows-8 gap-1 relative">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const legalMove = playerLegalMoves.find(m => m.row === r && m.col === c);
              const isHovered = hoveredMove?.row === r && hoveredMove?.col === c;
              const willFlip = isFlippedByHover(r, c);
              const isLast = lastPlacedCell?.r === r && lastPlacedCell?.c === c;

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
                      ? 'cursor-pointer hover:bg-[#e8dcce] hover:border-[#b83320]'
                      : 'cursor-default'
                  } bg-[#eadecc] border border-[#d1c2ad]`}
                  aria-label={`Square ${r + 1}, ${c + 1}`}
                >
                  {/* Star point doodle asterisk */}
                  {isStarPoint && cell === null && !legalMove && (
                    <span className="font-mono text-xs font-bold text-[#8a7a6a] pointer-events-none">✦</span>
                  )}

                  {/* Dual-sided Discs */}
                  {cell !== null && (
                    <div
                      className={`w-[85%] h-[85%] rounded-full transition-transform duration-200 flex items-center justify-center ${
                        cell === 'black'
                          ? 'bg-[#2c241c] text-white border-2 border-[#181410] shadow-[1px_2px_0px_rgba(0,0,0,0.5)]'
                          : 'bg-[#fffdf8] text-[#2c241c] border-2 border-[#2c241c] shadow-[1px_2px_0px_#2c241c]'
                      } ${willFlip ? 'scale-105 ring-2 ring-[#b83320] shadow-[0_0_8px_rgba(184,51,32,0.5)]' : ''} ${
                        isLast ? 'ring-2 ring-[#b83320]' : ''
                      }`}
                    >
                      <div
                        className={`w-[68%] h-[68%] rounded-full border ${
                          cell === 'black'
                            ? 'border-white/20'
                            : 'border-black/20'
                        }`}
                      />
                    </div>
                  )}

                  {/* Legal move red stamp dot */}
                  {cell === null && legalMove && !isAiTurn && (
                    <div className="relative flex items-center justify-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#b83320] opacity-80" />
                      {isHovered && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-['Patrick_Hand',cursive] font-bold text-white bg-[#b83320] px-1 rounded shadow-md z-20 pointer-events-none whitespace-nowrap">
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

