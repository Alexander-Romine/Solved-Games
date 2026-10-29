import React, { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { GameId } from '../types';
import { sounds } from '../utils/sound';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameId;
  gameName: string;
}

interface RuleItem {
  title: string;
  description: string;
}

const GAME_RULES: Record<GameId, { subtitle: string; rules: RuleItem[]; tip?: string }> = {
  checkers: {
    subtitle: 'Classic American Checkers on an 8×8 board',
    rules: [
      {
        title: 'Your Pieces',
        description: 'You control the White pieces starting at the bottom. The Computer controls the Dark pieces at the top.',
      },
      {
        title: 'Basic Movement',
        description: 'Pieces move diagonally forward by one square on the dark tiles only.',
      },
      {
        title: 'Mandatory Jumps',
        description: 'If you can jump diagonally over an adjacent opponent piece into an empty tile, you MUST capture it. If that same piece can make another jump, you must continue jumping.',
      },
      {
        title: 'Kings',
        description: 'Reaching the opposite back row crowns your piece into a King, enabling it to move and jump backwards as well as forward.',
      },
      {
        title: 'Win Condition',
        description: 'Capture all opponent pieces or leave them with no legal moves.',
      },
    ],
    tip: 'Keep your back row intact for as long as possible to prevent the computer from easily crowning kings.',
  },
  connect4: {
    subtitle: 'Vertical 7×6 grid connection game',
    rules: [
      {
        title: 'Your Turn',
        description: 'You play White discs; Computer plays Dark discs. Select any column with available space to drop a disc.',
      },
      {
        title: 'Gravity',
        description: 'Discs always fall to the lowest unoccupied space in the selected column.',
      },
      {
        title: 'Win Condition',
        description: 'First player to connect 4 discs in a straight line (horizontally, vertically, or diagonally) wins.',
      },
      {
        title: 'Draw',
        description: 'If all 42 slots fill without either player achieving 4-in-a-row, the game is a tie.',
      },
    ],
    tip: 'Control the center column early to maximize your potential 4-in-a-row combinations in all directions.',
  },
  mancala: {
    subtitle: 'Kalah variant with 6 pits and 1 store per player',
    rules: [
      {
        title: 'Board Setup',
        description: 'Your 6 pits are on the bottom side; your Store is the large basin on your right. The Computer occupies the top row with its store on the left.',
      },
      {
        title: 'Sowing Seeds',
        description: 'Pick up all seeds from any of your non-empty pits. Sowing moves counter-clockwise, dropping one seed into each pit and your own store (opponent store is skipped).',
      },
      {
        title: 'Free Turn',
        description: 'If the last seed of your sow lands in your own store, you immediately receive another turn.',
      },
      {
        title: 'Capture Rule',
        description: 'If your last seed lands in an empty pit on your side, and the opposing pit has seeds, you capture that seed and all seeds from the opposing pit into your store.',
      },
      {
        title: 'Game Over',
        description: 'The game ends when either side has 0 seeds in their pits. Remaining seeds on the other side go to that player. Highest seed count wins.',
      },
    ],
    tip: 'Plan your moves to land the final seed in your store repeatedly for free extra turns.',
  },
  nim: {
    subtitle: 'Ancient mathematical game of stone heaps',
    rules: [
      {
        title: 'Board Setup',
        description: 'Starts with 3 heaps containing 3, 4, and 5 stones respectively.',
      },
      {
        title: 'Turn Rule',
        description: 'On your turn, choose any single non-empty heap and take as many stones as you want (from 1 up to all remaining stones in that heap).',
      },
      {
        title: 'Single Heap Restriction',
        description: 'You cannot take stones from more than one heap in a single turn.',
      },
      {
        title: 'Normal Play Convention',
        description: 'The player who takes the very last stone remaining on the board wins the match.',
      },
    ],
    tip: 'Nim is mathematically solved using binary XOR sums (Nim-sum). Leaving an XOR sum of 0 puts the opponent in a losing position.',
  },
  tictactoe: {
    subtitle: 'Classic 3×3 alignment game',
    rules: [
      {
        title: 'Symbols',
        description: 'You are X and move first. The Computer is O.',
      },
      {
        title: 'Placement',
        description: 'Tap any empty grid square to place your mark.',
      },
      {
        title: 'Win Condition',
        description: 'Align three of your marks in any horizontal row, vertical column, or diagonal line.',
      },
      {
        title: 'Draw',
        description: 'If all 9 squares are filled and no one has three in a row, the match ends in a draw.',
      },
    ],
    tip: 'Under optimal play from both players, Tic-Tac-Toe always ends in a draw.',
  },
  reversi: {
    subtitle: 'Classic 8×8 Othello disc flipping strategy game',
    rules: [
      {
        title: 'Board Setup',
        description: 'You play Light (White) discs and move first; the Computer plays Dark (Black). Four discs begin in the center.',
      },
      {
        title: 'Outflanking & Flipping',
        description: 'Place a disc on an empty square to trap one or more continuous opponent discs between your newly placed disc and another of your discs in any straight line (horizontal, vertical, or diagonal). All trapped discs flip to your color.',
      },
      {
        title: 'Legal Move Requirement',
        description: 'Every move must flip at least one opponent disc. If you have no legal moves, your turn is automatically passed.',
      },
      {
        title: 'Win Condition',
        description: 'The game ends when neither player has a legal move or the board is completely full. The player with the most discs on the board wins.',
      },
    ],
    tip: 'Control the four corner squares! Corners can never be outflanked or flipped, giving you permanent anchors to claim entire edges.',
  },
};

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  activeGame,
  gameName,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        sounds.playTap();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const gameInfo = GAME_RULES[activeGame] || GAME_RULES.tictactoe;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        sounds.playTap();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
    >
      <div
        className="w-full max-w-lg bg-[#0f0f14] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-[#16161f]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-white" />
            <div>
              <h2
                id="instructions-modal-title"
                className="text-base font-semibold text-white tracking-wide"
              >
                {gameName}
              </h2>
              <p className="text-xs text-neutral-400">{gameInfo.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-2 sm:p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer touch-manipulation"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm select-text">
          <div className="space-y-3">
            {gameInfo.rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-[#171722] border border-neutral-700/70"
              >
                <div className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-600 text-[11px] font-mono font-semibold text-white flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-0.5">
                    {rule.title}
                  </h3>
                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {gameInfo.tip && (
            <div className="p-3.5 rounded-xl bg-[#1b1b26] border border-neutral-700 text-xs">
              <span className="font-semibold text-white uppercase tracking-wider text-[10px] block mb-1">
                Strategy Note
              </span>
              <p className="text-neutral-300 leading-relaxed">{gameInfo.tip}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-neutral-800 bg-[#14141d] flex justify-end">
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-5 py-2 sm:py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-colors cursor-pointer touch-manipulation active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
