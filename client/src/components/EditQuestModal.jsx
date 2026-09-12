import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Edit3,
  Sparkles,
  Coins,
  Dumbbell,
  Code,
  BookOpen,
  Palette
} from 'lucide-react';
import { useQuests } from '../context/QuestContext';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

const PRESET_CATEGORIES = [
  { id: 'Gym', label: 'Gym', stat: 'Strength', icon: Dumbbell, color: 'text-rose-400 border-rose-600 bg-rose-950/40' },
  { id: 'Coding', label: 'Coding', stat: 'Intellect', icon: Code, color: 'text-sky-400 border-sky-600 bg-sky-950/40' },
  { id: 'Study', label: 'Study', stat: 'Discipline', icon: BookOpen, color: 'text-amber-400 border-amber-600 bg-amber-950/40' },
  { id: 'Art', label: 'Art', stat: 'Creativity', icon: Palette, color: 'text-purple-400 border-purple-600 bg-purple-950/40' }
];

export const EditQuestModal = ({ isOpen, onClose, quest }) => {
  const { updateQuest } = useQuests();
  const { hero } = useAuth();
  const { playClick } = useSound();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Gym');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (quest) {
      setTitle(quest.title || '');
      setCategory(quest.category || 'Gym');
      setDescription(quest.description || '');
      setDifficulty(quest.difficulty || 'medium');
    }
  }, [quest]);

  if (!isOpen || !quest) return null;

  const calculateRewardPreview = () => {
    const baseTable = {
      trivial: { xp: 15, gold: 10 },
      easy: { xp: 35, gold: 20 },
      medium: { xp: 75, gold: 45 },
      hard: { xp: 150, gold: 90 },
      epic: { xp: 300, gold: 200 }
    };
    const base = baseTable[difficulty] || baseTable.medium;

    const classStats = {
      Warrior: 'Gym',
      Mage: 'Coding',
      Rogue: 'Art',
      Paladin: 'Study'
    };

    let xp = base.xp;
    if (classStats[hero?.heroClass] === category) {
      xp = Math.round(xp * 1.15);
    }
    return { xp, gold: base.gold };
  };

  const rewards = calculateRewardPreview();
  const currentPreset = PRESET_CATEGORIES.find((c) => c.id === category) || PRESET_CATEGORIES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Quest title is required.');
      return;
    }

    setSaving(true);
    playClick();

    const res = await updateQuest(quest._id, {
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      difficulty
    });

    setSaving(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.message || 'Failed to amend quest.');
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [submitting, onClose, playClick]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-quest-title"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-rpg-panel border-2 border-rpg-border rounded-lg shadow-2xl p-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-rpg-gold" />
            <h2 id="edit-quest-title" className="text-lg font-fantasy font-bold text-white tracking-wide">
              AMEND QUEST PARCHMENT
            </h2>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            aria-label="Close"
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 bg-rose-950/80 border border-rose-500 rounded text-rose-300 text-xs font-pixel">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              QUEST TITLE *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-rpg-card border border-slate-700 px-3 py-2 rounded text-xs text-white focus:outline-none focus:border-rpg-gold"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-pixel text-[10px] text-slate-300">
                CATEGORY & STAT AFFINITY *
              </label>
              <span className="text-[10px] font-pixel text-rpg-gold">
                +{currentPreset.stat}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      playClick();
                      setCategory(cat.id);
                    }}
                    className={`p-2 rounded text-center border transition-all ${
                      isSelected
                        ? `border-rpg-gold ${cat.color} shadow-glow-gold scale-[1.02]`
                        : 'border-slate-700 bg-rpg-card/60 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <span className="block font-pixel text-[10px] font-bold text-white">
                      {cat.label}
                    </span>
                    <span className="block text-[9px] font-sans text-slate-400">
                      +{cat.stat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              DESCRIPTION
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-rpg-card border border-slate-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-rpg-gold"
            />
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              DIFFICULTY RANK
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {['trivial', 'easy', 'medium', 'hard', 'epic'].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => {
                    playClick();
                    setDifficulty(d);
                  }}
                  className={`py-1.5 px-1 rounded text-center border font-pixel text-[9px] uppercase transition-all ${
                    difficulty === d
                      ? 'bg-amber-950 border-rpg-gold text-amber-300 shadow-glow-gold'
                      : 'bg-rpg-card border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-rpg-card rounded border border-slate-700/80">
            <span className="font-pixel text-[10px] text-slate-400">UPDATED REWARD:</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center font-pixel text-[11px] text-rpg-purple-light font-bold">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-rpg-purple-light" />
                +{rewards.xp} XP
              </span>
              <span className="flex items-center font-pixel text-[11px] text-rpg-gold font-bold">
                <Coins className="w-3.5 h-3.5 mr-1 text-rpg-gold" />
                +{rewards.gold} Gold
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-pixel btn-pixel-gold py-2.5 text-xs flex items-center justify-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>{saving ? 'SAVING AMENDMENT...' : 'SAVE AMENDMENT'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
