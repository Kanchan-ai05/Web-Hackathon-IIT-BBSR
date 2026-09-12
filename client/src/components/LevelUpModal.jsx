import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Coins,
  Award,
  X,
  Dumbbell,
  Code,
  BookOpen,
  Palette
} from 'lucide-react';
import { useQuests } from '../context/QuestContext';
import { useSound } from '../context/SoundContext';

export const LevelUpModal = () => {
  const { levelUpData, setLevelUpData } = useQuests();
  const { playClick } = useSound();

  useEffect(() => {
    if (levelUpData?.leveledUp) {
      const end = Date.now() + 2000;
      const colors = ['#f59e0b', '#fbbf24', '#8b5cf6', '#10b981', '#ef4444', '#38bdf8'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [levelUpData]);

  if (!levelUpData?.leveledUp) return null;

  const handleClose = () => {
    playClick();
    setLevelUpData(null);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="levelup-title"
          initial={{ scale: 0.5, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="relative w-full max-w-md bg-rpg-panel border-4 border-rpg-gold p-6 rounded-xl shadow-glow-gold-lg text-center"
        >
          <button
            onClick={handleClose}
            aria-label="Close celebration"
            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative mx-auto w-20 h-20 mb-3 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-rpg-gold/60"
            />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-rpg-gold to-yellow-200 flex items-center justify-center shadow-glow-gold">
              <Trophy className="w-8 h-8 text-slate-950" />
            </div>
          </div>

          <p className="text-xs font-pixel uppercase tracking-widest text-rpg-gold mb-1">
            Glorious Level Ascension!
          </p>
          <h2 id="levelup-title" className="text-3xl font-fantasy font-black text-white tracking-wide mb-1">
            LEVEL UP!
          </h2>
          <div className="inline-block bg-rpg-card border border-rpg-gold/60 px-4 py-1.5 rounded mb-4">
            <span className="font-pixel text-xl text-rpg-gold-light">
              HERO LEVEL {levelUpData.newLevel}
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-5 font-sans">
            Your relentless discipline elevates your standing. The realm acknowledges your greater mastery!
          </p>

          {/* Rewards Breakdown */}
          <div className="space-y-2.5 bg-rpg-card/90 border border-slate-700/80 p-4 rounded-lg mb-5 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center text-slate-300">
                <Coins className="w-4 h-4 mr-2 text-rpg-gold" />
                Level Bounty:
              </span>
              <span className="font-pixel text-xs text-rpg-gold font-bold">
                +{levelUpData.bonusGold || levelUpData.newLevel * 25} Gold
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="block font-pixel text-[10px] text-slate-400 mb-2">
                ALL 4 STATS INCREASED (+1):
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center space-x-1.5 text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-900/60">
                  <Dumbbell className="w-3.5 h-3.5 text-rose-400" />
                  <span>+1 Strength</span>
                </div>
                <div className="flex items-center space-x-1.5 text-sky-300 bg-sky-950/40 p-1.5 rounded border border-sky-900/60">
                  <Code className="w-3.5 h-3.5 text-sky-400" />
                  <span>+1 Intellect</span>
                </div>
                <div className="flex items-center space-x-1.5 text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/60">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>+1 Discipline</span>
                </div>
                <div className="flex items-center space-x-1.5 text-purple-300 bg-purple-950/40 p-1.5 rounded border border-purple-900/60">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>+1 Creativity</span>
                </div>
              </div>
            </div>

            {levelUpData.newlyUnlockedTitles?.length > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <span className="flex items-center text-slate-300">
                  <Award className="w-3.5 h-3.5 mr-2 text-rpg-purple-light" />
                  New Title:
                </span>
                <span className="font-pixel text-[10px] text-rpg-purple-light font-bold">
                  {levelUpData.newlyUnlockedTitles[0]}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className="w-full btn-pixel btn-pixel-gold py-3 text-xs flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            <span>CLAIM GLORY</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
