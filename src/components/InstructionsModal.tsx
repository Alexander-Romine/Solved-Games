import React, { useEffect } from 'react';
import { GameId } from '../types';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { sounds } from '../utils/sound';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameId;
  gameName: string;
}

interface GameRuleData {
  subtitle: string;
  rules: { title: string; description: string }[];
  tip?: string;
}

const GAME_RULES: Record<GameId, GameRuleData> = {
  checkers: {
    subtitle: 'Classic 8x8 draughts with compulsory capture',
    rules: [
      {
        title: 'Board & Setup',
        description: 'You command the Ivory pieces moving forward; the Computer commands the Charcoal pieces moving downward. Only dark squares are used.',
      },
      {
        title: 'Standard Moves',
        description: 'Pieces advance diagonally forward one square into an unoccupied dark space.',
      },
      {
        title: 'Capturing & Jumps',
        description: 'Jump diagonally over an adjacent opponent piece into an empty square beyond to capture it. If another jump is available from that position, multi-jumping is mandatory.',
      },
      {
        title: 'Crowning Kings',
        description: 'Reaching the opponent’s farthest row crowns your piece as a King, granting both forward and backward diagonal movement.',
      },
      {
        title: 'Victory Condition',
        description: 'Capture all opponent pieces or trap them so no legal moves remain to win the match.',
      },
    ],
    tip: 'Keep your back row intact as long as possible to prevent opponent pieces from earning King status.',
  },
  connect4: {
    subtitle: '7-column vertical gravity grid alignment',
    rules: [
      {
        title: 'Grid & Turns',
        description: 'Take turns dropping one token into any of the 7 columns. Gravity causes pieces to slide to the lowest vacant space.',
      },
      {
        title: 'Win Condition',
        description: 'Be the first to connect four of your tokens in a straight continuous line — horizontally, vertically, or diagonally.',
      },
      {
        title: 'Board Fill',
        description: 'If all 42 slots are filled without any 4-in-a-row alignment, the game ends in a draw.',
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
    subtitle: 'Ancient mathematical game of match heaps',
    rules: [
      {
        title: 'Board Setup',
        description: 'Starts with 3 heaps containing 3, 4, and 5 matches respectively.',
      },
      {
        title: 'Turn Rule',
        description: 'On your turn, choose any single non-empty heap and take as many matches as you want (from 1 up to all remaining in that heap).',
      },
      {
        title: 'Single Heap Restriction',
        description: 'You cannot take matches from more than one heap in a single turn.',
      },
      {
        title: 'Normal Play Convention',
        description: 'The player who takes the very last match remaining on the board wins the match.',
      },
    ],
    tip: 'Nim is mathematically solved using binary XOR sums (Nim-sum). Leaving an XOR sum of 0 puts the opponent in a losing position.',
  },
  tictactoe: {
    subtitle: 'Classic 3x3 alignment puzzle',
    rules: [
      {
        title: 'Symbols',
        description: 'You are Cinnabar X and move first. The Computer is Slate O.',
      },
      {
        title: 'Placement',
        description: 'Tap any empty grid square to sketch your mark.',
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
    subtitle: 'Classic 8x8 Othello disc flipping strategy game',
    rules: [
      {
        title: 'Board Setup',
        description: 'You play Light (Ivory) discs and move first; the Computer plays Dark (Charcoal). Four discs begin in the center.',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f1a15]/75 backdrop-blur-xs animate-fade-in font-['Patrick_Hand',cursive]"
      onClick={() => {
        sounds.playTap();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-modal-title"
    >
      <div
        className="w-full max-w-lg bg-[#fffdfa] hand-border-thick sketchbook-shadow overflow-hidden flex flex-col max-h-[85vh] relative transform rotate-0.5"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Washi Tape accent */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#ecd58e]/95 transform -rotate-1 shadow-sm border-t border-b border-[#c8b26e]/60 pointer-events-none z-20" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b-2 border-dashed border-[#cfc1b0] bg-[#faf6ed]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#b83320]" />
            <div>
              <h2
                id="instructions-modal-title"
                className="text-xl sm:text-2xl font-['Caveat',cursive] font-bold text-[#2c241c] tracking-wide"
              >
                {gameName} Field Notes
              </h2>
              <p className="text-xs font-mono text-[#786c5e]">{gameInfo.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="p-1 rounded-md text-[#5c5043] hover:text-black hover:bg-[#ede5d6] border border-[#2c241c] transition-colors cursor-pointer touch-manipulation"
            aria-label="Close field notes"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rules Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 text-sm select-text bg-[#fffdfa]">
          <div className="space-y-2.5">
            {gameInfo.rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-[#faf6ed] border-2 border-[#2c241c] shadow-[1px_2px_0px_#2c241c]"
              >
                <div className="w-5 h-5 rounded-full bg-[#b83320] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs font-mono">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2c241c] uppercase tracking-wide mb-0.5 font-['Caveat',cursive] text-base">
                    {rule.title}
                  </h3>
                  <p className="text-xs text-[#4a3f33] leading-relaxed">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {gameInfo.tip && (
            <div className="p-3.5 rounded-lg bg-[#fffbe6] border-2 border-dashed border-[#d4b106] text-xs shadow-xs relative">
              <span className="font-['Caveat',cursive] text-base font-bold text-[#996b00] block mb-0.5">
                ★ Zine Strategy Tip:
              </span>
              <p className="text-[#594d26] leading-relaxed italic">{gameInfo.tip}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t-2 border-dashed border-[#cfc1b0] bg-[#faf6ed] flex items-center justify-between">
          <span className="text-xs font-mono text-[#8a7f72]">Solved Tabletop Zine</span>
          <button
            onClick={() => {
              sounds.playTap();
              onClose();
            }}
            className="px-5 py-1 rounded-lg bg-[#2c241c] hover:bg-[#403831] text-[#faf6ee] font-['Patrick_Hand',cursive] font-bold text-sm tracking-wider transition-all cursor-pointer shadow-[2px_2px_0px_#8c4233] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
