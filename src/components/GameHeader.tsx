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
  isAiTurn = false,
  onResetGame,
}) => {
  return (
    <div className="relative w-full max-w-[480px] mb-3 px-1 select-none flex items-center justify-between min-h-[32px]">
      {/* Turn / Game Status (Left aligned) */}
      <div className="flex items-center gap-2 min-w-0 max-w-[34%] z-10">
        {isGameOver ? (
          <span className="w-2 h-2 rounded-full bg-white shrink-0" />
        ) : (
          <span
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
              isAiTurn
                ? 'bg-neutral-400 animate-pulse'
                : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]'
            }`}
          />
        )}
        <span
          className={`truncate font-medium text-xs sm:text-sm ${
            isGameOver ? 'text-white font-semibold' : 'text-neutral-100'
          }`}
        >
          {statusText}
        </span>
      </div>

      {/* Scoreboard: You vs Computer - ALWAYS locked dead-center */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 text-neutral-300 font-mono text-xs sm:text-sm whitespace-nowrap pointer-events-none z-0">
        <span>
          You <strong className="text-white font-bold tabular-nums">{stats.playerWins}</strong>
        </span>
        <span className="text-neutral-400 font-sans text-xs">vs</span>
        <span>
          <strong className="text-white font-bold tabular-nums">{stats.aiWins}</strong> Computer
        </span>
      </div>

      {/* Discreet Reset Button (Right aligned) */}
      <div className="flex items-center justify-end z-10">
        <button
          onClick={() => {
            sounds.playTap();
            onResetGame();
          }}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-colors cursor-pointer shrink-0 touch-manipulation"
          title="Start a new game"
        >
          <RotateCcw className="w-3 h-3 text-neutral-300" />
          <span>New</span>
        </button>
      </div>
    </div>
  );
};
