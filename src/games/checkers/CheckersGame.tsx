import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { GameStats } from '../../types';
import {
  CheckersBoard,
  CheckersPlayer,
  Move,
  Position,
} from './types';
import {
  createInitialBoard,
  getAllLegalMoves,
  executeMove,
  getBestCheckersMove,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';
import { Crown } from 'lucide-react';

interface CheckersGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

export const CheckersGame: React.FC<CheckersGameProps> = ({ stats, onUpdateStats }) => {
  const [board, setBoard] = useState<CheckersBoard>(createInitialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<CheckersPlayer>('p1');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMovesForSelected, setLegalMovesForSelected] = useState<Move[]>([]);
  const [continuationPiece, setContinuationPiece] = useState<Position | null>(null);
  const [winner, setWinner] = useState<CheckersPlayer | 'draw' | null>(null);
  const [, setHistory] = useState<{ board: CheckersBoard }[]>([]);
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
    }, 380);

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

  useEffect(() => {
    if (winner === 'p2') {
      const timer = setTimeout(() => {
        resetGame();
      }, 3800);
      return () => clearTimeout(timer);
    }
  }, [winner, resetGame]);

  const getStatusText = () => {
    if (winner) {
      return winner === 'p1' ? 'You Won!' : 'Bot Won!';
    }
    if (continuationPiece) {
      return 'Jump Required!';
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

      {/* Hand-drawn Checkerboard Canvas */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-3 sm:p-4 rounded-xl bg-[#fffdfa] hand-border-thick paper-note-shadow flex items-center justify-center select-none relative">
        {/* Washi tape strip on top left */}
        <div className="absolute -top-3 left-8 w-18 h-5 bg-[#f0a89a]/90 transform -rotate-3 shadow-xs border-t border-b border-[#cf7e70]/60 pointer-events-none z-20" />

        <div className="grid grid-cols-8 grid-rows-8 gap-0 border-3 border-[#2c241c] rounded-md overflow-hidden w-full h-full aspect-square">
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
                    isDarkSquare ? 'bg-[#baa990]' : 'bg-[#fffdf8]'
                  } ${
                    isDarkSquare && !winner && (cell?.player === 'p1' || isMoveTarget) && !isAiTurn
                      ? 'cursor-pointer hover:brightness-105'
                      : 'cursor-default'
                  }`}
                  aria-label={`Square ${r}, ${c}`}
                >
                  {isMoveTarget && (
                    <div className="absolute z-20 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#b83320] ring-3 ring-[#b83320]/40 animate-pulse pointer-events-none" />
                  )}

                  {cell && (
                    <div
                      className={`w-[85%] h-[85%] aspect-square rounded-full shrink-0 relative flex items-center justify-center transition-transform duration-150 ${
                        cell.player === 'p1'
                          ? 'bg-[#faf7ee] text-[#2c241c] border-2 border-[#2c241c] shadow-[1px_2px_0px_#2c241c]'
                          : 'bg-[#2c241c] text-[#faf7ee] border-2 border-[#181410] shadow-[1px_2px_0px_rgba(0,0,0,0.5)]'
                      } ${isSelected ? 'scale-110 ring-3 ring-[#b83320]' : ''} ${
                        pieceHasLegalMove && !isSelected && !winner && !isAiTurn ? 'hover:scale-105' : ''
                      }`}
                    >
                      {/* Hand-drawn concentric ring doodle on piece */}
                      <div className="absolute inset-1 rounded-full border border-current opacity-30 pointer-events-none" />
                      
                      {cell.isKing && (
                        <Crown
                          className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0 ${
                            cell.player === 'p1'
                              ? 'text-[#b83320] fill-[#b83320]/30'
                              : 'text-[#f59e0b] fill-[#f59e0b]/40'
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

