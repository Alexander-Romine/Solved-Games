import React from 'react';
import { GameId } from '../types';
import { Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/sound';

interface HeaderProps {
  activeGame: GameId;
  onSelectGame: (game: GameId) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenInstructions: () => void;
  gameList: { id: GameId; name: string }[];
}

export const Header: React.FC<HeaderProps> = ({
  activeGame,
  onSelectGame,
  isMuted,
  onToggleMute,
  onOpenInstructions,
  gameList,
}) => {
  return (
    <header className="relative flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-8 py-3 sm:py-4 min-h-[56px] sm:min-h-[66px] border-b border-neutral-800 bg-black/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Polished Wordmark */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        <span className="text-sm sm:text-lg font-bold tracking-[0.14em] sm:tracking-[0.16em] text-white uppercase font-['Outfit',sans-serif] whitespace-nowrap drop-shadow-[0_1px_8px_rgba(255,255,255,0.25)]">
          Solved Games
        </span>
      </div>

      {/* Navigation Progress Dots - Centered on screen */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3.5">
        {gameList.map((game, idx) => {
          const isActive = activeGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => {
                sounds.playTap();
                onSelectGame(game.id);
              }}
              className="group relative flex items-center justify-center p-2 sm:p-2 cursor-pointer transition-all touch-manipulation"
              title={`Game ${idx + 1}`}
              aria-label={`Go to game ${idx + 1}`}
            >
              <div
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.95)] ring-2 ring-white/30'
                    : 'bg-neutral-600 hover:bg-neutral-400'
                }`}
              />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-neutral-200 text-[10px] px-2 py-0.5 rounded border border-neutral-700 pointer-events-none whitespace-nowrap z-40">
                {isActive ? game.name : `Game ${idx + 1}`}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        <button
          onClick={() => {
            sounds.playTap();
            onOpenInstructions();
          }}
          title="Game Rules & Instructions"
          className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
          aria-label="Game rules and instructions"
        >
          <HelpCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className="p-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer touch-manipulation"
          aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
        </button>
      </div>
    </header>
  );
};
