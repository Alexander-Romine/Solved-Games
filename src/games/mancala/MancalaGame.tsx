import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStats } from '../../types';
import {
  MancalaPlayer,
  MancalaState,
} from './types';
import {
  P1_PITS,
  P1_STORE,
  P2_PITS,
  P2_STORE,
  createInitialMancalaState,
  getBestMancalaMove,
  isValidMancalaMove,
} from './engine';
import { sounds } from '../../utils/sound';
import { GameHeader } from '../../components/GameHeader';

interface MancalaGameProps {
  stats: GameStats;
  onUpdateStats: (result: 'win' | 'loss' | 'draw') => void;
}

function getDotPositions(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 50, y: 50 }];
  if (count === 2) return [{ x: 38, y: 50 }, { x: 62, y: 50 }];
  if (count === 3) return [{ x: 50, y: 32 }, { x: 34, y: 65 }, { x: 66, y: 65 }];
  if (count === 4) return [{ x: 35, y: 35 }, { x: 65, y: 35 }, { x: 35, y: 65 }, { x: 65, y: 65 }];
  if (count === 5) return [{ x: 32, y: 32 }, { x: 68, y: 32 }, { x: 50, y: 50 }, { x: 32, y: 68 }, { x: 68, y: 68 }];
  if (count === 6) return [{ x: 34, y: 28 }, { x: 66, y: 28 }, { x: 34, y: 50 }, { x: 66, y: 50 }, { x: 34, y: 72 }, { x: 66, y: 72 }];
  if (count === 7) return [{ x: 32, y: 28 }, { x: 68, y: 28 }, { x: 26, y: 50 }, { x: 50, y: 50 }, { x: 74, y: 50 }, { x: 32, y: 72 }, { x: 68, y: 72 }];
  if (count === 8) return [
    { x: 32, y: 26 }, { x: 68, y: 26 },
    { x: 24, y: 50 }, { x: 50, y: 50 }, { x: 76, y: 50 },
    { x: 32, y: 74 }, { x: 68, y: 74 },
    { x: 50, y: 26 }
  ];

  const positions: { x: number; y: number }[] = [];
  const maxToDisplay = Math.min(count, 14);
  const radius = maxToDisplay > 8 ? 30 : 25;
  for (let i = 0; i < maxToDisplay; i++) {
    const angle = (i / maxToDisplay) * 2 * Math.PI - Math.PI / 2;
    positions.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    });
  }
  return positions;
}

export const MancalaGame: React.FC<MancalaGameProps> = ({ stats, onUpdateStats }) => {
  const [state, setState] = useState<MancalaState>(createInitialMancalaState);
  const [displayPits, setDisplayPits] = useState<number[]>(() => createInitialMancalaState().pits);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [activeDropPit, setActiveDropPit] = useState<number | null>(null);
  const [activePickupPit, setActivePickupPit] = useState<number | null>(null);
  const [handSeeds, setHandSeeds] = useState<number | null>(null);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);

  const isAiTurn = state.currentPlayer === 2 && !state.gameOver;

  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const resetGame = useCallback(() => {
    animationTimersRef.current.forEach(clearTimeout);
    animationTimersRef.current = [];
    const initial = createInitialMancalaState();
    setState(initial);
    setDisplayPits([...initial.pits]);
    setIsAnimating(false);
    setActiveDropPit(null);
    setActivePickupPit(null);
    setHandSeeds(null);
    setActiveNotification(null);
  }, []);

  const executeAnimatedMove = useCallback((startPit: number) => {
    if (isAnimating || state.gameOver) return;
    if (!isValidMancalaMove(state, startPit)) return;

    const initialPits = [...state.pits];
    const totalSeeds = initialPits[startPit];
    if (totalSeeds <= 0) return;

    const player = state.currentPlayer;
    const ownStore = player === 1 ? P1_STORE : P2_STORE;
    const oppStore = player === 1 ? P2_STORE : P1_STORE;

    animationTimersRef.current.forEach(clearTimeout);
    animationTimersRef.current = [];

    setIsAnimating(true);
    setActivePickupPit(startPit);
    setActiveNotification(null);
    sounds.playPieceClick();

    const workingPits = [...initialPits];
    workingPits[startPit] = 0;
    setDisplayPits([...workingPits]);
    setHandSeeds(totalSeeds);

    const dropSequence: number[] = [];
    let curr = startPit;
    for (let i = 0; i < totalSeeds; i++) {
      curr = (curr + 1) % 14;
      if (curr === oppStore) {
        curr = (curr + 1) % 14;
      }
      dropSequence.push(curr);
    }

    const STEP_DURATION = 130;

    dropSequence.forEach((targetPit, stepIndex) => {
      const timer = setTimeout(() => {
        workingPits[targetPit]++;
        setDisplayPits([...workingPits]);
        setActiveDropPit(targetPit);
        setHandSeeds(totalSeeds - (stepIndex + 1));
        sounds.playSowSeed(1 + (stepIndex % 8) * 0.04);
      }, (stepIndex + 1) * STEP_DURATION);
      animationTimersRef.current.push(timer);
    });

    const totalSowTime = (dropSequence.length + 1) * STEP_DURATION;

    const finalizeTimer = setTimeout(() => {
      setActiveDropPit(null);
      setHandSeeds(null);

      const lastPit = dropSequence[dropSequence.length - 1];
      let hadExtraTurn = false;
      let capturedCount = 0;

      if (lastPit === ownStore) {
        hadExtraTurn = true;
      } else {
        const isOwnSide = player === 1
          ? (lastPit >= 0 && lastPit <= 5)
          : (lastPit >= 7 && lastPit <= 12);

        if (isOwnSide && workingPits[lastPit] === 1) {
          const oppositePit = 12 - lastPit;
          if (workingPits[oppositePit] > 0) {
            capturedCount = workingPits[oppositePit] + 1;
            workingPits[ownStore] += capturedCount;
            workingPits[lastPit] = 0;
            workingPits[oppositePit] = 0;
            setDisplayPits([...workingPits]);
            sounds.playCapture();
          }
        }
      }

      const p1Empty = P1_PITS.every(p => workingPits[p] === 0);
      const p2Empty = P2_PITS.every(p => workingPits[p] === 0);

      let isGameOver = false;
      let winner: MancalaPlayer | 'tie' | null = null;

      if (p1Empty || p2Empty) {
        isGameOver = true;
        for (const p of P1_PITS) {
          workingPits[P1_STORE] += workingPits[p];
          workingPits[p] = 0;
        }
        for (const p of P2_PITS) {
          workingPits[P2_STORE] += workingPits[p];
          workingPits[p] = 0;
        }
        setDisplayPits([...workingPits]);

        if (workingPits[P1_STORE] > workingPits[P2_STORE]) {
          winner = 1;
          sounds.playWin();
          onUpdateStats('win');
        } else if (workingPits[P2_STORE] > workingPits[P1_STORE]) {
          winner = 2;
          sounds.playDraw();
          onUpdateStats('loss');
        } else {
          winner = 'tie';
          sounds.playDraw();
          onUpdateStats('loss');
        }
      } else {
        if (hadExtraTurn) {
          sounds.playBonus();
          setActiveNotification(player === 1 ? 'Free Turn Earned!' : 'Bot Free Turn');
        } else if (capturedCount > 0) {
          setActiveNotification(`${player === 1 ? 'You' : 'Bot'} captured stones`);
        }
      }

      const nextPlayer: MancalaPlayer = hadExtraTurn ? player : (player === 1 ? 2 : 1);

      setState({
        pits: [...workingPits],
        currentPlayer: nextPlayer,
        gameOver: isGameOver,
        winner,
        hadExtraTurn,
        lastCapturedCount: capturedCount,
      });

      setActivePickupPit(null);
      setIsAnimating(false);
    }, totalSowTime + 120);

    animationTimersRef.current.push(finalizeTimer);
  }, [isAnimating, state, onUpdateStats]);

  useEffect(() => {
    if (state.gameOver || state.currentPlayer !== 2 || isAnimating) {
      return;
    }

    const timer = setTimeout(() => {
      const bestMove = getBestMancalaMove(state);
      executeAnimatedMove(bestMove);
    }, 400);

    return () => clearTimeout(timer);
  }, [state, isAnimating, executeAnimatedMove]);

  const renderPitDots = (count: number) => {
    if (count === 0) return null;
    const positions = getDotPositions(count);
    const beadColors = ['#b83320', '#1f4e78', '#2e6940', '#d97706', '#6b3ba6'];

    return (
      <div className="absolute inset-0 pointer-events-none">
        {positions.map((pos, idx) => (
          <div
            key={idx}
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              backgroundColor: beadColors[idx % beadColors.length],
            }}
            className="w-2.5 h-2.5 rounded-full border border-[#1c1813] shadow-xs -translate-x-1/2 -translate-y-1/2 absolute transition-all duration-150"
          />
        ))}
      </div>
    );
  };

  const renderStoreDots = (count: number) => {
    if (count === 0) return null;
    const displayCount = Math.min(count, 22);
    const beadColors = ['#b83320', '#1f4e78', '#2e6940', '#d97706', '#6b3ba6'];

    return (
      <div className="absolute inset-2 flex flex-wrap items-center justify-center content-center gap-1 pointer-events-none overflow-hidden">
        {Array.from({ length: displayCount }).map((_, i) => (
          <div
            key={i}
            style={{ backgroundColor: beadColors[i % beadColors.length] }}
            className="w-2.5 h-2.5 rounded-full border border-[#1c1813] shadow-xs transition-all duration-150"
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (state.gameOver && (state.winner === 2 || state.winner === 'tie')) {
      const timer = setTimeout(() => {
        resetGame();
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [state.gameOver, state.winner, resetGame]);

  const getStatusText = () => {
    if (state.gameOver) {
      if (state.winner === 'tie') return 'Draw Match';
      return state.winner === 1 ? 'You won Kalah!' : 'Bot won!';
    }
    if (isAnimating && handSeeds !== null) {
      return '';
    }
    if (activeNotification) return activeNotification;
    return '';
  };

  return (
    <div className="w-full max-w-[480px] mx-auto flex flex-col items-center">
      <GameHeader
        stats={stats}
        statusText={getStatusText()}
        isGameOver={state.gameOver}
        isAiTurn={isAiTurn || isAnimating}
        onResetGame={resetGame}
      />

      {/* Sketched Mancala Board Container */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-xl bg-[#fffdfa] hand-border-thick paper-note-shadow flex items-center justify-center select-none relative">
        {/* Washi tape strip on top */}
        <div className="absolute -top-3 left-12 w-20 h-5 bg-[#e2c1df]/90 transform rotate-2 shadow-xs border-t border-b border-[#bd99ba]/60 pointer-events-none z-20" />

        {/* Hand-drawn Tray */}
        <div className="w-full h-[220px] sm:h-[240px] p-2 sm:p-3 bg-[#f5ede1] border-2 border-[#2c241c] rounded-xl flex items-stretch justify-between gap-1.5 sm:gap-3 relative shadow-inner">
          {/* Computer Store (Left) */}
          <div className="flex flex-col items-center justify-between w-11 sm:w-14 py-1 shrink-0">
            <span className="text-[11px] font-['Caveat',cursive] text-[#5c5043] font-bold uppercase tracking-wider">
              Bot Store
            </span>
            <div
              className={`w-full flex-1 my-1 rounded-xl bg-[#e8dcce] border-2 border-[#2c241c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] relative flex items-center justify-center overflow-hidden transition-all duration-150 ${
                activeDropPit === P2_STORE
                  ? 'ring-3 ring-[#1f4e78] scale-[1.03] bg-[#dbe5ed]'
                  : ''
              }`}
              title={`Bot Store: ${displayPits[P2_STORE]} stones`}
            >
              {renderStoreDots(displayPits[P2_STORE])}
              <span className="absolute bottom-1 font-['Courier_Prime',monospace] font-bold text-xs text-[#2c241c]">
                {displayPits[P2_STORE]}
              </span>
            </div>
          </div>

          {/* Central 2 Rows of 6 Pits */}
          <div className="flex-1 flex flex-col justify-between py-1 px-0.5">
            {/* Top Row: Bot Pits */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {P2_PITS.slice().reverse().map(pitIdx => {
                const count = displayPits[pitIdx];
                const isDropping = activeDropPit === pitIdx;
                const isPickup = activePickupPit === pitIdx;

                return (
                  <div key={pitIdx} className="flex justify-center items-center">
                    <div
                      className={`w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#e8dcce] border-2 relative flex items-center justify-center cursor-default transition-all duration-150 ${
                        isDropping
                          ? 'border-[#1f4e78] ring-3 ring-[#1f4e78]/40 scale-110 bg-[#dbe5ed]'
                          : isPickup
                          ? 'border-dashed border-[#8c7f70] opacity-75'
                          : 'border-[#2c241c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.15)]'
                      }`}
                      aria-label={`Bot space with ${count} stones`}
                    >
                      {renderPitDots(count)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sowing Route Doodle Line */}
            <div className="flex items-center justify-center my-0.5 min-h-[16px]">
              {isAnimating && handSeeds !== null ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#fffdfa] border-2 border-[#2c241c] text-[11px] font-['Caveat',cursive] font-bold text-[#b83320] shadow-xs">
                  <span>Sowing: {handSeeds} left in hand</span>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between text-[#8a7a6a] px-2 text-[10px] font-['Patrick_Hand',cursive]">
                  <span>⤹ counter-clockwise</span>
                  <div className="w-24 h-0.5 border-t border-dashed border-[#8a7a6a]" />
                  <span>sowing ⤸</span>
                </div>
              )}
            </div>

            {/* Bottom Row: Human Pits */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {P1_PITS.map(pitIdx => {
                const count = displayPits[pitIdx];
                const isDropping = activeDropPit === pitIdx;
                const isPickup = activePickupPit === pitIdx;
                const isClickable = !state.gameOver && !isAnimating && state.currentPlayer === 1 && count > 0;

                return (
                  <div key={pitIdx} className="flex justify-center items-center">
                    <button
                      type="button"
                      onClick={() => executeAnimatedMove(pitIdx)}
                      disabled={!isClickable}
                      className={`w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#e8dcce] border-2 relative flex items-center justify-center transition-all duration-150 touch-manipulation ${
                        isDropping
                          ? 'border-[#b83320] ring-3 ring-[#b83320]/40 scale-110 bg-[#fcedeb]'
                          : isPickup
                          ? 'border-dashed border-[#8c7f70] opacity-75'
                          : isClickable
                          ? 'cursor-pointer border-[#2c241c] hover:border-[#b83320] hover:scale-105 shadow-[1px_2px_0px_#2c241c]'
                          : 'cursor-default border-[#2c241c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.15)]'
                      }`}
                      aria-label={`Your pit with ${count} stones`}
                    >
                      {renderPitDots(count)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human Store (Right) */}
          <div className="flex flex-col items-center justify-between w-11 sm:w-14 py-1 shrink-0">
            <span className="text-[11px] font-['Caveat',cursive] text-[#5c5043] font-bold uppercase tracking-wider">
              You
            </span>
            <div
              className={`w-full flex-1 my-1 rounded-xl bg-[#e8dcce] border-2 border-[#2c241c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] relative flex items-center justify-center overflow-hidden transition-all duration-150 ${
                activeDropPit === P1_STORE
                  ? 'ring-3 ring-[#b83320] scale-[1.03] bg-[#fcedeb]'
                  : ''
              }`}
              title={`Your Store: ${displayPits[P1_STORE]} stones`}
            >
              {renderStoreDots(displayPits[P1_STORE])}
              <span className="absolute bottom-1 font-['Courier_Prime',monospace] font-bold text-xs text-[#2c241c]">
                {displayPits[P1_STORE]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



