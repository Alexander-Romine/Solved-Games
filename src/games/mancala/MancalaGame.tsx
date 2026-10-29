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

// Geometric coordinates for clear, intuitive dot patterns inside circular pits
function getDotPositions(count: number): { x: number; y: number }[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: 50, y: 50 }];
  if (count === 2) return [{ x: 35, y: 50 }, { x: 65, y: 50 }];
  if (count === 3) return [{ x: 50, y: 32 }, { x: 34, y: 66 }, { x: 66, y: 66 }];
  if (count === 4) return [{ x: 34, y: 34 }, { x: 66, y: 34 }, { x: 34, y: 66 }, { x: 66, y: 66 }];
  if (count === 5) return [{ x: 32, y: 32 }, { x: 68, y: 32 }, { x: 50, y: 50 }, { x: 32, y: 68 }, { x: 68, y: 68 }];
  if (count === 6) return [{ x: 34, y: 28 }, { x: 66, y: 28 }, { x: 34, y: 50 }, { x: 66, y: 50 }, { x: 34, y: 72 }, { x: 66, y: 72 }];
  if (count === 7) return [{ x: 32, y: 28 }, { x: 68, y: 28 }, { x: 26, y: 50 }, { x: 50, y: 50 }, { x: 74, y: 50 }, { x: 32, y: 72 }, { x: 68, y: 72 }];
  if (count === 8) return [
    { x: 32, y: 26 }, { x: 68, y: 26 },
    { x: 24, y: 50 }, { x: 50, y: 50 }, { x: 76, y: 50 },
    { x: 32, y: 74 }, { x: 68, y: 74 },
    { x: 50, y: 26 }
  ];

  // For 9+, circular cluster distribution
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

  // Cleanup on unmount
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

    // Clear any pending timers
    animationTimersRef.current.forEach(clearTimeout);
    animationTimersRef.current = [];

    setIsAnimating(true);
    setActivePickupPit(startPit);
    setActiveNotification(null);
    sounds.playPieceClick();

    // Pick up seeds
    const workingPits = [...initialPits];
    workingPits[startPit] = 0;
    setDisplayPits([...workingPits]);
    setHandSeeds(totalSeeds);

    // Calculate counter-clockwise distribution route
    const dropSequence: number[] = [];
    let curr = startPit;
    for (let i = 0; i < totalSeeds; i++) {
      curr = (curr + 1) % 14;
      if (curr === oppStore) {
        curr = (curr + 1) % 14;
      }
      dropSequence.push(curr);
    }

    const STEP_DURATION = 140; // ms per seed drop

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

    // After sowing finishes, resolve captures, store sweeps, bonuses, and turn transition
    const finalizeTimer = setTimeout(() => {
      setActiveDropPit(null);
      setHandSeeds(null);

      const lastPit = dropSequence[dropSequence.length - 1];
      let hadExtraTurn = false;
      let capturedCount = 0;

      // Check extra turn
      if (lastPit === ownStore) {
        hadExtraTurn = true;
      } else {
        // Check capture: landed in empty pit on own side
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

      // Check game over
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
          setActiveNotification(player === 1 ? 'Free Turn: You' : 'Free Turn: Computer');
        } else if (capturedCount > 0) {
          setActiveNotification(`${player === 1 ? 'You' : 'Computer'} captured stones`);
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

  // AI Turn trigger
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

  // Purely visual dots for spaces (no numbers)
  const renderPitDots = (count: number) => {
    if (count === 0) return null;
    const positions = getDotPositions(count);

    return (
      <div className="absolute inset-0 pointer-events-none">
        {positions.map((pos, idx) => (
          <div
            key={idx}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_1px_3px_rgba(255,255,255,0.8),inset_0_1px_1px_rgba(255,255,255,1)] border border-neutral-300 -translate-x-1/2 -translate-y-1/2 absolute transition-all duration-150"
          />
        ))}
      </div>
    );
  };

  // Visual dots for stores
  const renderStoreDots = (count: number) => {
    if (count === 0) return null;
    const displayCount = Math.min(count, 22);

    return (
      <div className="absolute inset-2 flex flex-wrap items-center justify-center content-center gap-1 pointer-events-none overflow-hidden">
        {Array.from({ length: displayCount }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white shadow-[0_1px_3px_rgba(255,255,255,0.7)] border border-neutral-300 transition-all duration-150"
          />
        ))}
      </div>
    );
  };

  // Auto-refresh after ~1s on loss or draw
  useEffect(() => {
    if (state.gameOver && (state.winner === 2 || state.winner === 'tie')) {
      const timer = setTimeout(() => {
        resetGame();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.gameOver, state.winner, resetGame]);

  const getStatusText = () => {
    if (state.gameOver) {
      if (state.winner === 'tie') return 'Computer won';
      return state.winner === 1 ? 'You won' : 'Computer won';
    }
    if (isAnimating && handSeeds !== null) {
      return `Distributing stones (${handSeeds} in hand)`;
    }
    if (activeNotification) return activeNotification;
    return state.currentPlayer === 1 ? 'Your Turn' : 'Thinking...';
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

      {/* Standardized Box Container (480px) */}
      <div className="w-[min(340px,calc(100vw-32px))] sm:w-[440px] md:w-[480px] h-[min(340px,calc(100vw-32px))] sm:h-[440px] md:h-[480px] p-2.5 sm:p-4 rounded-3xl bg-[#131319] border border-neutral-700/80 shadow-[0_0_25px_rgba(255,255,255,0.03),0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-center select-none">
        {/* Sleek Horizontal Board Chassis */}
        <div className="w-full h-[210px] sm:h-[230px] p-2 sm:p-3 bg-[#1c1c26] border border-neutral-700 rounded-2xl flex items-stretch justify-between gap-1.5 sm:gap-3 relative shadow-inner">
          {/* Computer Store (Left, Pit 13) */}
          <div className="flex flex-col items-center justify-between w-10 sm:w-14 py-1 shrink-0">
            <span className="text-[10px] font-mono text-neutral-300 font-medium uppercase tracking-wider">
              Comp
            </span>
            <div
              className={`w-full flex-1 my-1 rounded-2xl bg-[#0f0f15] border border-neutral-700/80 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] relative flex items-center justify-center overflow-hidden transition-all duration-150 ${
                activeDropPit === P2_STORE
                  ? 'ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.9)] scale-[1.03] bg-neutral-800'
                  : ''
              }`}
              title={`Computer Store: ${displayPits[P2_STORE]} stones`}
            >
              {renderStoreDots(displayPits[P2_STORE])}
            </div>
          </div>

          {/* Central 2 Rows of 6 Circular Pits */}
          <div className="flex-1 flex flex-col justify-between py-1 px-0.5">
            {/* Top Row: Computer Pits (12 down to 7) */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
              {P2_PITS.slice().reverse().map(pitIdx => {
                const count = displayPits[pitIdx];
                const isDropping = activeDropPit === pitIdx;
                const isPickup = activePickupPit === pitIdx;

                return (
                  <div key={pitIdx} className="flex justify-center items-center">
                    <div
                      className={`w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#0f0f15] border relative flex items-center justify-center cursor-default transition-all duration-150 ${
                        isDropping
                          ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.95)] scale-110 bg-neutral-800 border-white'
                          : isPickup
                          ? 'border-dashed border-neutral-400 opacity-80'
                          : 'border-neutral-700/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)]'
                      }`}
                      aria-label={`Opponent space with ${count} stones`}
                    >
                      {renderPitDots(count)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtle Divider / Active Sowing Status */}
            <div className="flex items-center justify-center my-0.5 min-h-[16px]">
              {isAnimating && handSeeds !== null ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-600 text-[10px] font-mono text-neutral-200 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Sowing: {handSeeds} in hand</span>
                </div>
              ) : (
                <div className="w-full h-px bg-neutral-700/80 mx-2" />
              )}
            </div>

            {/* Bottom Row: Human Pits (0 up to 5) - Clickable with animated sowing */}
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
                      className={`w-9 h-9 sm:w-12 sm:h-12 md:w-13 md:h-13 rounded-full bg-[#0f0f15] border relative flex items-center justify-center transition-all duration-150 touch-manipulation ${
                        isDropping
                          ? 'ring-2 ring-white shadow-[0_0_12px_rgba(255,255,255,0.95)] scale-110 bg-neutral-800 border-white'
                          : isPickup
                          ? 'border-dashed border-neutral-400 opacity-80'
                          : isClickable
                          ? 'cursor-pointer border-neutral-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] hover:border-white ring-1 ring-white/40 hover:scale-105'
                          : 'cursor-default border-neutral-700/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)]'
                      }`}
                      aria-label={`Your space with ${count} stones`}
                    >
                      {renderPitDots(count)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human Store (Right, Pit 6) */}
          <div className="flex flex-col items-center justify-between w-10 sm:w-14 py-1 shrink-0">
            <span className="text-[10px] font-mono text-neutral-300 font-medium uppercase tracking-wider">
              You
            </span>
            <div
              className={`w-full flex-1 my-1 rounded-2xl bg-[#0f0f15] border border-neutral-700/80 shadow-[inset_0_3px_8px_rgba(0,0,0,0.95)] relative flex items-center justify-center overflow-hidden transition-all duration-150 ${
                activeDropPit === P1_STORE
                  ? 'ring-2 ring-white shadow-[0_0_14px_rgba(255,255,255,0.9)] scale-[1.03] bg-neutral-800'
                  : ''
              }`}
              title={`Your Store: ${displayPits[P1_STORE]} stones`}
            >
              {renderStoreDots(displayPits[P1_STORE])}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
