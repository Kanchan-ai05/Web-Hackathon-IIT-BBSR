import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins } from 'lucide-react';
import { useQuests } from '../context/QuestContext';

export const FloatingRewards = () => {
  const { floatingRewards } = useQuests();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {floatingRewards.map((reward) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: -75,
              scale: [0.6, 1.25, 1.15, 0.9]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${reward.x}px`,
              top: `${reward.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            className="flex items-center space-x-2 bg-rpg-panel/90 border-2 border-rpg-gold px-3 py-1.5 rounded shadow-glow-gold backdrop-blur-sm"
          >
            <span className="flex items-center text-rpg-purple-light font-pixel text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-rpg-purple-light" />
              +{reward.xp} XP
            </span>
            <span className="flex items-center text-rpg-gold font-pixel text-xs font-bold">
              <Coins className="w-3.5 h-3.5 mr-1 text-rpg-gold" />
              +{reward.gold} Gold
            </span>
            {reward.statBonus && (
              <span className="flex items-center text-emerald-400 font-pixel text-xs font-bold border-l border-slate-700 pl-2">
                {reward.statBonus}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
