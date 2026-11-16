import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameId, AllStats, GameStats } from './types';
import { Header } from './components/Header';
import { AmbientBackground } from './components/AmbientBackground';
import { InstructionsModal } from './components/InstructionsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckersGame } from './games/checkers/CheckersGame';
import { Connect4Game } from './games/connect4/Connect4Game';
import { MancalaGame } from './games/mancala/MancalaGame';
import { NimGame } from './games/nim/NimGame';
import { TicTacToeGame } from './games/tictactoe/TicTacToeGame';
import { ReversiGame } from './games/reversi/ReversiGame';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Load stats from localStorage
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

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  const currentIndex = EXHIBIT_GAMES.findIndex(g => g.id === activeGame);

  return (
    <div className="min-h-screen text-[#26221c] flex flex-col items-center justify-start p-2 sm:p-6 lg:p-8 relative overflow-x-hidden font-['Patrick_Hand',cursive]">
      {/* Background craft desk texture */}
      <AmbientBackground />

      {/* The Wider Open Sketchbook Folio Container */}
      <div className="w-full max-w-4xl lg:max-w-5xl bg-[#faf7ef] rounded-2xl border-4 border-[#2c241c] sketchbook-shadow relative flex flex-col my-auto overflow-hidden pb-4">
        {/* Top Spiral Wire Binding Rings across the wider format */}
        <div className="w-full bg-[#ede5d5] border-b-2 border-[#2c241c] px-4 py-2 flex items-center justify-between select-none relative">
          <div className="flex items-center gap-2 sm:gap-3 w-full justify-around">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2c241c] shadow-inner mb-[-6px] z-10" />
                <div className="spiral-ring" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#2c241c] shadow-inner mt-[-6px] z-10" />
              </div>
            ))}
          </div>
        </div>

        

        {/* Notebook Top Header */}
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

        {/* Main Sketchbook Page Canvas */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-8 py-3 sm:py-5 flex flex-col items-center justify-center relative"
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

          {/* Hand-drawn Page Flipping Navigation */}
          <div className="flex items-center justify-between w-full max-w-[520px] mt-4 px-2 select-none border-t-2 border-dashed border-[#cfc1b0] pt-2.5">
            <button
              onClick={handlePrevGame}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[#2e261f] hover:text-black bg-[#faf6ee] hover:bg-[#efe7d6] border-2 border-[#2e261f] transition-all cursor-pointer shadow-[2px_2px_0px_#2e261f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none touch-manipulation font-['Patrick_Hand',cursive] text-sm sm:text-base font-bold"
              title="Previous Game"
              aria-label="Previous Game"
            >
              <ChevronLeft className="w-4 h-4 text-[#8c4233]" />
              <span>← Prev Page</span>
            </button>
            
            <div className="font-['Caveat',cursive] text-lg text-[#6f6354] transform -rotate-1">
              • page {currentIndex + 1} of {EXHIBIT_GAMES.length} •
            </div>

            <button
              onClick={handleNextGame}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[#2e261f] hover:text-black bg-[#faf6ee] hover:bg-[#efe7d6] border-2 border-[#2e261f] transition-all cursor-pointer shadow-[2px_2px_0px_#2e261f] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none touch-manipulation font-['Patrick_Hand',cursive] text-sm sm:text-base font-bold"
              title="Next Game"
              aria-label="Next Game"
            >
              <span>Next Page →</span>
              <ChevronRight className="w-4 h-4 text-[#8c4233]" />
            </button>
          </div>
        </main>
      </div>

      {/* Game Rules Modal - Folded Pamphlet */}
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

