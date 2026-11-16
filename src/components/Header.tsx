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
  const tapeColors = [
    'bg-[#edd998]/90', // Yellow washi
    'bg-[#f0a89a]/90', // Coral washi
    'bg-[#a9d4bd]/90', // Sage washi
    'bg-[#a5cde3]/90', // Sky washi
    'bg-[#e2c1df]/90', // Lilac washi
    'bg-[#e8cb9b]/90', // Amber washi
  ];

  return (
    <header className="w-full px-4 sm:px-8 py-2.5 z-30 select-none bg-[#faf7ef]/95 backdrop-blur-xs border-b-2 border-[#2c241c] shadow-[0_2px_8px_rgba(40,30,20,0.06)]">
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Clean Sketchbook Title */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="text-2xl sm:text-3xl font-['Caveat',cursive] font-bold text-[#2e261f] tracking-wide inline-block transform -rotate-1">
              Solved Games
            </span>
          </div>
        </div>

        {/* Washi Tape Index Bookmark Tabs */}
        <nav className="flex items-center flex-wrap justify-center gap-1.5 sm:gap-2.5">
          {gameList.map((game, idx) => {
            const isActive = activeGame === game.id;
            const tapeColor = tapeColors[idx % tapeColors.length];

            return (
              <button
                key={game.id}
                onClick={() => {
                  sounds.playTap();
                  onSelectGame(game.id);
                }}
                className={`group relative px-2.5 sm:px-3 py-1 rounded-sm cursor-pointer transition-transform touch-manipulation font-['Patrick_Hand',cursive] text-sm sm:text-base ${tapeColor} ${
                  isActive
                    ? 'scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.25)] font-bold text-[#1f1914] -rotate-1 ring-2 ring-[#2e261f]'
                    : 'opacity-75 hover:opacity-100 hover:scale-102 text-[#3b3229] rotate-1'
                }`}
                title={game.name}
                aria-label={`Go to ${game.name}`}
              >
                <span className="text-xs font-mono mr-1 opacity-70">#{idx + 1}</span>
                <span>{game.name}</span>
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#b83320] ring-1 ring-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right tools: Rules zine & sound */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playTap();
              onOpenInstructions();
            }}
            title="Field Notes & Rules"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-['Patrick_Hand',cursive] text-[#3c342b] hover:text-[#181410] bg-[#faf6ee] hover:bg-[#efe7d6] border-2 border-[#3c342b] rounded-lg transition-all cursor-pointer shadow-[2px_2px_0px_#3c342b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label="Game rules and instructions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#8c4233]" />
            <span>Rules</span>
          </button>

          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 text-[#3c342b] hover:text-[#181410] bg-[#faf6ee] hover:bg-[#efe7d6] border-2 border-[#3c342b] rounded-lg transition-all cursor-pointer shadow-[2px_2px_0px_#3c342b] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#8c7f70]" /> : <Volume2 className="w-3.5 h-3.5 text-[#2e6940]" />}
          </button>
        </div>
      </div>
    </header>
  );
};
