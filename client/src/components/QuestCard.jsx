import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  RotateCcw,
  Trash2,
  Edit2,
  Coins,
  Sparkles,
  Flame,
  Dumbbell,
  Code,
  BookOpen,
  Palette,
  Tag
} from 'lucide-react';
import { useQuests } from '../context/QuestContext';
import { useSound } from '../context/SoundContext';
import { EditQuestModal } from './EditQuestModal';

export const QuestCard = ({ quest }) => {
  const { completeQuest, undoQuest, deleteQuest } = useQuests();
  const { playClick } = useSound();
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const coords = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    if (quest.completed) {
      playClick();
      undoQuest(quest._id);
    } else {
      completeQuest(quest._id, coords);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    playClick();
    if (window.confirm(`Dismiss quest "${quest.title}" from your log?`)) {
      deleteQuest(quest._id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    playClick();
    setEditModalOpen(true);
  };

  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'trivial':
        return 'bg-slate-800 text-slate-300 border-slate-600';
      case 'easy':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
      case 'medium':
        return 'bg-sky-950/80 text-sky-300 border-sky-600';
      case 'hard':
        return 'bg-purple-950/80 text-purple-300 border-purple-600';
      case 'epic':
        return 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-glow-gold';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'Gym':
        return { icon: Dumbbell, stat: 'STR', color: 'text-rose-400' };
      case 'Coding':
        return { icon: Code, stat: 'INT', color: 'text-sky-400' };
      case 'Study':
        return { icon: BookOpen, stat: 'DISC', color: 'text-amber-400' };
      case 'Art':
        return { icon: Palette, stat: 'CREAT', color: 'text-purple-400' };
      default:
        return { icon: Tag, stat: cat || 'STAT', color: 'text-slate-300' };
    }
  };

  const catInfo = getCategoryBadge(quest.category);
  const CatIcon = catInfo.icon;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`group relative bg-rpg-card border-2 rounded-lg p-4 transition-all duration-200 ${
          quest.completed
            ? 'border-slate-800/80 bg-rpg-card/50 opacity-75'
            : 'border-rpg-border hover:border-rpg-gold/70 hover:shadow-glow-gold/20 hover:-translate-y-0.5 shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3.5 flex-1 min-w-0">
            {/* 16-Bit Checkbox with glowing micro-interaction */}
            <button
              onClick={handleCheckboxClick}
              aria-label={quest.completed ? 'Reopen quest' : `Complete quest: ${quest.title}`}
              className={`mt-0.5 w-6 h-6 rounded flex-shrink-0 flex items-center justify-center transition-all duration-150 border-2 ${
                quest.completed
                  ? 'bg-emerald-600 border-emerald-400 text-slate-950 shadow-glow-emerald'
                  : 'bg-rpg-panel border-slate-600 hover:border-rpg-gold hover:shadow-glow-gold group-hover:scale-105 active:scale-95'
              }`}
            >
              {quest.completed && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            {/* Quest Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {/* Category & Stat Badge */}
                <span className="flex items-center space-x-1 font-pixel text-[9px] px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-white">
                  <CatIcon className={`w-3 h-3 ${catInfo.color}`} />
                  <span>{quest.category || 'Gym'}</span>
                  <span className={catInfo.color}>+{catInfo.stat}</span>
                </span>

                {/* Type Badge */}
                <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-rpg-panel border border-slate-700 text-slate-400">
                  {quest.questType === 'daily' ? 'DAILY HABIT' : 'QUEST'}
                </span>

                {/* Difficulty Badge */}
                <span
                  className={`font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded border ${getDifficultyBadge(
                    quest.difficulty
                  )}`}
                >
                  {quest.difficulty}
                </span>

                {/* Daily Streak Badge */}
                {quest.questType === 'daily' && quest.streak > 0 && (
                  <span className="flex items-center space-x-1 font-pixel text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-600/50 text-amber-300">
                    <Flame className="w-2.5 h-2.5 text-amber-400" />
                    <span>{quest.streak}d streak</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h3
                className={`text-base font-semibold text-white tracking-wide transition-all ${
                  quest.completed ? 'line-through text-slate-400' : 'text-slate-100'
                }`}
              >
                {quest.title}
              </h3>

              {/* Description */}
              {quest.description && (
                <p
                  className={`text-xs mt-1 font-sans ${
                    quest.completed ? 'text-slate-500 line-through' : 'text-slate-400'
                  }`}
                >
                  {quest.description}
                </p>
              )}

              {/* Bottom Rewards Bar */}
              <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-slate-800/80">
                <span className="flex items-center font-pixel text-[10px] text-rpg-purple-light font-bold">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-rpg-purple-light" />
                  +{quest.xpReward} XP
                </span>
                <span className="flex items-center font-pixel text-[10px] text-rpg-gold font-bold">
                  <Coins className="w-3.5 h-3.5 mr-1 text-rpg-gold" />
                  +{quest.goldReward} Gold
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit, Undo, Delete */}
          <div className="flex items-center space-x-1">
            {!quest.completed && (
              <button
                onClick={handleEdit}
                title="Edit Quest"
                aria-label="Edit Quest"
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-rpg-panel hover:shadow-glow-gold rounded transition-all active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {quest.completed && (
              <button
                onClick={handleCheckboxClick}
                title="Undo completion"
                aria-label="Undo completion"
                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-rpg-panel hover:shadow-glow-purple rounded transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleDelete}
              title="Delete Quest"
              aria-label="Delete Quest"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-rpg-panel hover:shadow-glow-ruby rounded transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Edit Quest Modal */}
      <EditQuestModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        quest={quest}
      />
    </>
  );
};
