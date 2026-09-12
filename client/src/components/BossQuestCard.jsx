import React from 'react';
import { motion } from 'framer-motion';
import {
  Skull,
  Shield,
  Coins,
  Sparkles,
  CheckSquare,
  Square,
  Trash2,
  Swords,
  Trophy
} from 'lucide-react';
import { useQuests } from '../context/QuestContext';
import { useSound } from '../context/SoundContext';

export const BossQuestCard = ({ quest }) => {
  const { toggleBossSubtask, deleteQuest } = useQuests();
  const { playClick } = useSound();

  const hpPercent = Math.max(0, Math.round((quest.bossHp / quest.bossMaxHp) * 100));

  const getHpColor = (percent) => {
    if (percent > 60) return 'from-emerald-600 to-emerald-400';
    if (percent > 25) return 'from-amber-600 to-amber-400';
    return 'from-rose-700 to-red-500 animate-pulse-fast';
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    playClick();
    if (window.confirm(`Abandon raid on "${quest.bossName}"?`)) {
      deleteQuest(quest._id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative bg-gradient-to-b from-rpg-panel to-rpg-card border-2 rounded-lg p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 ${
        quest.completed
          ? 'border-rpg-emerald/60 shadow-glow-emerald'
          : 'border-rpg-ruby/70 shadow-glow-ruby hover:shadow-glow-ruby-lg'
      }`}
    >
      {/* Top Banner Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-12 h-12 rounded flex items-center justify-center border-2 ${
              quest.completed
                ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                : 'bg-rose-950 border-rose-500 text-rose-400'
            }`}
          >
            {quest.completed ? <Trophy className="w-7 h-7" /> : <Skull className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                BOSS RAID
              </span>
              <span className="font-pixel text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500">
                {quest.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-fantasy font-bold text-white tracking-wide mt-1">
              {quest.bossName || 'Dungeon Colossus'}: {quest.title}
            </h3>
          </div>
        </div>

        <button
          onClick={handleDelete}
          title="Abandon Raid"
          aria-label="Abandon Raid"
          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-rpg-card rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {quest.description && (
        <p className="text-xs text-slate-400 mb-4 font-sans">{quest.description}</p>
      )}

      {/* Boss HP Bar */}
      <div className="mb-5 bg-slate-900/90 border border-slate-700 p-2.5 rounded">
        <div className="flex justify-between items-center mb-1">
          <span className="flex items-center font-pixel text-[10px] text-rose-400">
            <Swords className="w-3.5 h-3.5 mr-1" />
            BOSS HEALTH
          </span>
          <span className="font-pixel text-[10px] text-rose-300 font-bold">
            {quest.bossHp} / {quest.bossMaxHp} HP ({hpPercent}%)
          </span>
        </div>
        <div className="relative h-4 w-full bg-slate-950 rounded overflow-hidden p-0.5 border border-slate-800">
          <motion.div
            initial={false}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4 }}
            className={`h-full bg-gradient-to-r ${getHpColor(hpPercent)} rounded-sm`}
          />
        </div>
      </div>

      {/* Checklist / Subtasks to deal damage */}
      <div className="space-y-2 mb-4">
        <p className="font-pixel text-[10px] text-slate-300 uppercase tracking-wider">
          TACTICAL MILESTONES (STRIKES):
        </p>
        {quest.subTasks?.map((subtask) => (
          <button
            key={subtask._id}
            onClick={() => toggleBossSubtask(quest._id, subtask._id)}
            aria-label={`Toggle strike: ${subtask.title}`}
            className={`w-full flex items-center space-x-3 p-2.5 rounded text-left transition-all border ${
              subtask.completed
                ? 'bg-slate-900/60 border-slate-800 text-slate-500 line-through'
                : 'bg-rpg-card border-slate-700 hover:border-rpg-ruby hover:shadow-glow-ruby/20 text-slate-200 active:scale-[0.99]'
            }`}
          >
            {subtask.completed ? (
              <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
            )}
            <span className="text-xs font-sans font-medium flex-1">{subtask.title}</span>
          </button>
        ))}
      </div>

      {/* Rewards Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="flex items-center font-pixel text-[10px] text-rpg-purple-light font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            +{quest.xpReward} XP
          </span>
          <span className="flex items-center font-pixel text-[10px] text-rpg-gold font-bold">
            <Coins className="w-3.5 h-3.5 mr-1" />
            +{quest.goldReward} Gold
          </span>
        </div>

        {quest.completed && (
          <span className="font-pixel text-[10px] text-rpg-emerald font-bold uppercase">
            🏆 BOSS CONQUERED!
          </span>
        )}
      </div>
    </motion.div>
  );
};
