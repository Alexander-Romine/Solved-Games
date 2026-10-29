/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AllStats, GameId, GameStats } from './types';
import { Header } from './components/Header';
import { InstructionsModal } from './components/InstructionsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AmbientBackground } from './components/AmbientBackground';
import { CheckersGame } from './games/checkers/CheckersGame';
import { Connect4Game } from './games/connect4/Connect4Game';
import { MancalaGame } from './games/mancala/MancalaGame';
import { NimGame } from './games/nim/NimGame';
import { TicTacToeGame } from './games/tictactoe/TicTacToeGame';
import { ReversiGame } from './games/reversi/ReversiGame';
import { sounds } from './utils/sound';

const DEFAULT_STATS: GameStats = {
  playerWins: 0,
  aiWins: 0,
  draws: 0,
  aiStreak: 0,
};

const INITIAL_ALL_STATS: AllStats = {
  checkers: { ...DEFAULT_STATS },
  connect4: { ...DEFAULT_STATS },
  mancala: { ...DEFAULT_STATS },
  nim: { ...DEFAULT_STATS },
  tictactoe: { ...DEFAULT_STATS },
  reversi: { ...DEFAULT_STATS },
};

export const EXHIBIT_GAMES: { id: GameId; name: string }[] = [
  { id: 'tictactoe', name: 'Tic-Tac-Toe' },
  { id: 'connect4', name: 'Connect 4' },
  { id: 'checkers', name: 'Checkers' },
  { id: 'mancala', name: 'Mancala' },
  { id: 'nim', name: 'Nim' },
  { id: 'reversi', name: 'Reversi' },
];

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>('tictactoe');
  const [isMuted, setIsMuted] = useState(() => sounds.isMuted());
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // Load stats from localStorage (migrating any previous ties into computer wins)
  const [allStats, setAllStats] = useState<AllStats>(() => {
    try {
      const saved = localStorage.getItem('tabletop_stats_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const migrated: Partial<AllStats> = {};
        for (const [key, val] of Object.entries(parsed)) {
          const s = val as GameStats;
          migrated[key as GameId] = {
            ...s,
            aiWins: (s.aiWins || 0) + (s.draws || 0),
            draws: 0,
          };
        }
        return { ...INITIAL_ALL_STATS, ...migrated };
      }
    } catch {}
    return INITIAL_ALL_STATS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('tabletop_stats_v2', JSON.stringify(allStats));
    } catch {}
  }, [allStats]);

  const handleUpdateStats = (result: 'win' | 'loss' | 'draw') => {
    // Ties count as wins for the computer
    const isPlayerWin = result === 'win';

    setAllStats(prev => {
      const current = prev[activeGame] || DEFAULT_STATS;
      const newAiStreak = isPlayerWin ? 0 : (current.aiStreak >= 0 ? current.aiStreak + 1 : 1);

      return {
        ...prev,
        [activeGame]: {
          playerWins: isPlayerWin ? current.playerWins + 1 : current.playerWins,
          aiWins: !isPlayerWin ? current.aiWins + 1 : current.aiWins,
          draws: 0,
          aiStreak: newAiStreak,
        },
      };
    });
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleNextGame = useCallback(() => {
    const currentIndex = EXHIBIT_GAMES.findIndex(g => g.id === activeGame);
    const nextIndex = (currentIndex + 1) % EXHIBIT_GAMES.length;
    sounds.playTap();
    setActiveGame(EXHIBIT_GAMES[nextIndex].id);
  }, [activeGame]);

  const handlePrevGame = useCallback(() => {
    const currentIndex = EXHIBIT_GAMES.findIndex(g => g.id === activeGame);
    const prevIndex = (currentIndex - 1 + EXHIBIT_GAMES.length) % EXHIBIT_GAMES.length;
    sounds.playTap();
    setActiveGame(EXHIBIT_GAMES[prevIndex].id);
  }, [activeGame]);

  // Keyboard navigation for exhibit hall (Left / Right arrow keys)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only if not inside an input/textarea
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      return;
    }
    if (isInstructionsOpen) {
      if (e.key === 'Escape') {
        setIsInstructionsOpen(false);
      }
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNextGame();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevGame();
    }
  }, [handleNextGame, handlePrevGame, isInstructionsOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    // Only trigger if mostly horizontal swipe of at least 50px
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX > 0) {
        handlePrevGame();
      } else {
        handleNextGame();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const currentGame = EXHIBIT_GAMES.find(g => g.id === activeGame);

  return (
    <div className="min-h-screen bg-transparent text-neutral-100 flex flex-col relative overflow-hidden">
      {/* Ambient Animated Monochrome Background */}
      <AmbientBackground />

      {/* Navigation Header */}
      <Header
        activeGame={activeGame}
        onSelectGame={setActiveGame}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenInstructions={() => {
          sounds.playTap();
          setIsInstructionsOpen(true);
        }}
        gameList={EXHIBIT_GAMES}
      />

      {/* Main Game Stage - centered on the screen with touch swipe support */}
      <main
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 w-full max-w-xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col items-center justify-center"
      >
        {activeGame === 'checkers' && (
          <CheckersGame
            stats={allStats.checkers}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeGame === 'connect4' && (
          <Connect4Game
            stats={allStats.connect4}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeGame === 'mancala' && (
          <MancalaGame
            stats={allStats.mancala}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeGame === 'nim' && (
          <NimGame
            stats={allStats.nim}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeGame === 'tictactoe' && (
          <TicTacToeGame
            stats={allStats.tictactoe}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeGame === 'reversi' && (
          <ReversiGame
            stats={allStats.reversi || DEFAULT_STATS}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 mt-3 sm:mt-3.5 select-none">
          <button
            onClick={handlePrevGame}
            className="p-2 sm:p-1.5 rounded-full text-neutral-300 hover:text-white bg-neutral-900/80 sm:bg-transparent border border-neutral-700/80 sm:border-transparent hover:border-neutral-600 transition-colors cursor-pointer group touch-manipulation"
            title="Previous Game"
            aria-label="Previous Game"
          >
            <ChevronLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform group-hover:-translate-x-0.5 text-neutral-300 group-hover:text-white" />
          </button>
          <button
            onClick={handleNextGame}
            className="p-2 sm:p-1.5 rounded-full text-neutral-300 hover:text-white bg-neutral-900/80 sm:bg-transparent border border-neutral-700/80 sm:border-transparent hover:border-neutral-600 transition-colors cursor-pointer group touch-manipulation"
            title="Next Game"
            aria-label="Next Game"
          >
            <ChevronRight className="w-4 h-4 sm:w-3.5 sm:h-3.5 transition-transform group-hover:translate-x-0.5 text-neutral-300 group-hover:text-white" />
          </button>
        </div>
      </main>

      {/* Game Rules Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        activeGame={activeGame}
        gameName={currentGame?.name || 'Game'}
      />

      {/* Offline connectivity indicator */}
      <OfflineIndicator />
    </div>
  );
}
