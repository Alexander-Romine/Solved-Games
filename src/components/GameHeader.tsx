import React from 'react';
import { RotateCcw } from 'lucide-react';
import { GameStats } from '../types';
import { sounds } from '../utils/sound';

interface GameHeaderProps {
  stats: GameStats;
  statusText: string;
  isGameOver?: boolean;
  winner?: string | number | null;
  isAiTurn?: boolean;
  onResetGame: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  stats,
  statusText,
  isGameOver = false,
  onResetGame,
}) => {
  return (
    <div className="relative w-full max-w-[520px] mb-3 px-1 select-none flex items-center justify-between min-h-[38px]">
      {/* Left side: Displays ONLY game-over result stamps (Bot Won / You Won) or urgent rule notices */}
      <div className="flex items-center min-w-0 z-10">
        {statusText ? (
          <div className="animate-stamp-slam">
            <span
              className={`px-2.5 py-0.5 rounded border-2 font-['Courier_Prime',monospace] font-bold text-xs sm:text-sm uppercase tracking-wider transform -rotate-2 shadow-xs ${
                statusText.toLowerCase().includes('you won')
                  ? 'border-[#2e6940] text-[#2e6940] bg-[#eef7f0]'
                  : 'border-[#b83320] text-[#b83320] bg-[#fcedeb]'
              }`}
            >
              {statusText}
            </span>
          </div>
        ) : null}
      </div>

      {/* Rubber Stamped Scorecard in Center */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 bg-[#fffdfa] border-2 border-[#b83320] rounded-sm transform -rotate-1 shadow-[1px_2px_0px_rgba(184,51,32,0.3)] pointer-events-none z-0">
        <span className="font-['Courier_Prime',monospace] text-xs font-bold text-[#b83320] uppercase tracking-wider">
          YOU <span className="underline underline-offset-2">{stats.playerWins}</span> : <span className="underline underline-offset-2">{stats.aiWins}</span> BOT
        </span>
      </div>

      {/* Hand-drawn Reset Button */}
      <div className="flex items-center justify-end z-10">
        <button
          onClick={() => {
            sounds.playTap();
            onResetGame();
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-['Patrick_Hand',cursive] font-bold text-[#2e261f] bg-[#faf6ee] hover:bg-[#efe7d6] border-2 border-[#2e261f] rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-[2px_2px_0px_#2e261f] cursor-pointer touch-manipulation"
          title="New game round"
        >
          <RotateCcw className="w-3 h-3 text-[#2e261f]" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
