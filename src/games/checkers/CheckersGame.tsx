import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Crown } from 'lucide-react';
import { GameStats } from '../../types';
import {
  CheckersBoard,
  CheckersMove,
  CheckersPlayer,
  Position,
} from './types';
import {
  createInitialBoard,
  getAllLegalMoves,
  getBestCheckersMove,
  executeMove,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface CheckersGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<CheckersBoard>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<CheckersPlayer>('p1');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<CheckersMove[]>([]);
  const [continuationPiece, setContinuationPiece] = useState<Position | null>(null);
  const [winner, setWinner] = useState<CheckersPlayer | 'draw' | null>(null);
  const [history, setHistory] = useState<{ board: CheckersBoard }[]>([]);
  const [, startTransition] = useTransition();

  const isAiTurn = currentPlayer === 'p2';

  const resetGame = useCallback(() => {
    setBoard(createInitialBoard());
    setCurrentPlayer('p1');
    setSelectedPos(null);
    setLegalMovesForSelected([]);
    setContinuationPiece(null);
    setWinner(null);
    setHistory([]);
  }, []);

  const currentLegalMoves = getAllLegalMoves(board, currentPlayer, false, continuationPiece);

  const checkGameOver = useCallback((currentB: CheckersBoard, player: CheckersPlayer) => {
    const moves = getAllLegalMoves(currentB, player, false, null);
    if (moves.length === 0) {
      const opposingPlayer: CheckersPlayer = player === 'p1' ? 'p2' : 'p1';
      setWinner(opposingPlayer);
      if (opposingPlayer === 'p1') {
        sounds.playWin();
        onUpdateStats('win');
      } else {
        sounds.playDraw();
        onUpdateStats('loss');
      }
      return true;
    }
    return false;
  }, [onUpdateStats]);

  // AI Turn effect
  useEffect(() => {
    if (winner || currentPlayer !== 'p2') {
      return;
    }

    const timer = setTimeout(() => {
      const bestMove = getBestCheckersMove(board, 'p2', true, continuationPiece);

      if (!bestMove) {
        checkGameOver(board, 'p2');
        return;
      }

      startTransition(() => {
        const { newBoard, canMultiJump, nextContinuation } = executeMove(board, bestMove);

        if (bestMove.isJump) {
          sounds.playCapture();
        } else {
          sounds.playDrop();
        }

        setBoard(newBoard);

        if (canMultiJump && nextContinuation) {
          setContinuationPiece(nextContinuation);
        } else {
          setContinuationPiece(null);
          setCurrentPlayer('p1');
          checkGameOver(newBoard, 'p1');
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [currentPlayer, board, continuationPiece, winner, checkGameOver]);

  const handleCellClick = (r: number, c: number) => {
    if (winner || currentPlayer !== 'p1') {
      return;
    }

    const clickedPiece = board[r][c];

    if (clickedPiece && clickedPiece.player === 'p1') {
      if (continuationPiece && (continuationPiece.r !== r || continuationPiece.c !== c)) {
        return;
      }

      const pieceMoves = currentLegalMoves.filter(m => m.from.r === r && m.from.c === c);
      if (pieceMoves.length > 0) {
        sounds.playPieceClick();
        setSelectedPos({ r, c });
        setLegalMovesForSelected(pieceMoves);
      }
      return;
    }

    if (selectedPos) {
      const targetMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (targetMove) {
        setHistory(prev => [...prev, { board }]);

        const { newBoard, canMultiJump, nextContinuation } = executeMove(board, targetMove);

        if (targetMove.isJump) {
          sounds.playCapture();
        } else {
          sounds.playDrop();
        }

        setBoard(newBoard);
        setSelectedPos(null);
        setLegalMovesForSelected([]);

        if (canMultiJump && nextContinuation) {
          setContinuationPiece(nextContinuation);
          setSelectedPos(nextContinuation);
          const nextMoves = getAllLegalMoves(newBoard, 'p1', true, nextContinuation);
          setLegalMovesForSelected(nextMoves);
        } else {
          setContinuationPiece(null);
          setCurrentPlayer('p2');
          checkGameOver(newBoard, 'p2');
        }
      }
    }
  };


  // Auto-refresh after ~1s of losing
  useEffect(() => {
    if (winner === 'p2') {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [winner, resetGame]);

  const getStatusText = () => {
    if (winner) {
      return winner === 'p1' ? 'You won' : 'Computer won';
    }
    if (continuationPiece) {
      return 'Jump required';
    }
    return currentPlayer === 'p1' ? 'Your Turn' : 'Thinking...';
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
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-3 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-center select-none">
        <div className="grid grid-cols-8 grid-rows-8 gap-0 border border-neutral-700 rounded-xl overflow-hidden w-full h-full aspect-square shadow-inner">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDarkSquare = (r + c) % 2 === 1;
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const isMoveTarget = legalMovesForSelected.some(m => m.to.r === r && m.to.c === c);
              const pieceHasLegalMove = currentLegalMoves.some(m => m.from.r === r && m.from.c === c);

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isDarkSquare || winner !== null}
                  className={`relative w-full h-full aspect-square flex items-center justify-center overflow-hidden p-0.5 sm:p-1 select-none transition-all touch-manipulation ${
                    isDarkSquare ? 'bg-[#1a1a24]' : 'bg-[#363644]'
                  } ${
                    isDarkSquare && !winner && (cell?.player === 'p1' || isMoveTarget) && !isAiTurn
                      ? 'cursor-pointer hover:brightness-110'
                      : 'cursor-default'
                  }`}
                  aria-label={`Square ${r}, ${c}`}
                >
                  {isMoveTarget && (
                    <div className="absolute z-20 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white ring-4 ring-white/40 animate-pulse pointer-events-none" />
                  )}

                  {cell && (
                    <div
                      className={`w-[82%] h-[82%] aspect-square rounded-full shrink-0 relative flex items-center justify-center transition-transform duration-150 ${
                        cell.player === 'p1'
                          ? 'bg-gradient-to-br from-white via-neutral-100 to-neutral-200 text-neutral-900 border-2 border-white ring-1 ring-white/60 shadow-[0_3px_8px_rgba(0,0,0,0.8)]'
                          : 'bg-gradient-to-br from-neutral-700 via-neutral-850 to-neutral-950 text-white border-2 border-neutral-400 ring-1 ring-white/30 shadow-[0_3px_8px_rgba(0,0,0,0.9)]'
                      } ${isSelected ? 'scale-110 ring-2 ring-white' : ''} ${
                        pieceHasLegalMove && !isSelected && !winner && !isAiTurn ? 'hover:scale-105' : ''
                      }`}
                    >
                      <div className="absolute inset-1 rounded-full border border-black/20 pointer-events-none" />
                      {cell.isKing && (
                        <Crown
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 drop-shadow ${
                            cell.player === 'p1'
                              ? 'text-neutral-900 fill-neutral-900/30'
                              : 'text-white fill-white/40'
                          }`}
                        />
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
