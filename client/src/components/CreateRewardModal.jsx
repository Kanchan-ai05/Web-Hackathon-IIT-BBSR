import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Sparkles,
  Gamepad2,
  Coffee,
  Utensils,
  BookOpen,
  Trophy,
  Music,
  Tv,
  Coins,
  Scroll
} from 'lucide-react';
import { useSound } from '../context/SoundContext';
import api from '../services/api';

const ICONS = [
  { id: 'Sparkles', icon: Sparkles, label: 'Magic' },
  { id: 'Gamepad2', icon: Gamepad2, label: 'Gaming' },
  { id: 'Coffee', icon: Coffee, label: 'Beverage' },
  { id: 'Utensils', icon: Utensils, label: 'Feast' },
  { id: 'BookOpen', icon: BookOpen, label: 'Reading' },
  { id: 'Tv', icon: Tv, label: 'Show/Film' },
  { id: 'Music', icon: Music, label: 'Concert' },
  { id: 'Trophy', icon: Trophy, label: 'Trophy' }
];

export const CreateRewardModal = ({ isOpen, onClose, onCreated }) => {
  const { playClick, playCoin } = useSound();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState(50);
  const [selectedIcon, setSelectedIcon] = useState('Gamepad2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please name your reward.');
      return;
    }

    if (Number(cost) <= 0) {
      setError('Cost must be greater than 0 Gold.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/shop/rewards', {
        name: name.trim(),
        description: description.trim(),
        cost: Number(cost),
        icon: selectedIcon
      });

      if (res.data.success) {
        playCoin();
        onCreated(res.data.reward);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create reward scroll.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-rpg-panel border-2 border-rpg-gold rounded-lg shadow-glow-gold p-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Scroll className="w-5 h-5 text-rpg-gold" />
            <h2 className="text-base font-fantasy font-bold text-white tracking-wide">
              FORGE CUSTOM REWARD SCROLL
            </h2>
          </div>
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2 bg-rose-950/80 border border-rose-500 rounded text-rose-300 text-xs font-pixel">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              REWARD NAME *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1 Hour Video Games, Favorite Pizza..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-rpg-card border border-slate-700 px-3 py-2 rounded text-xs text-white focus:outline-none focus:border-rpg-gold"
            />
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              DESCRIPTION / VOW
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Unwind guilt-free with favorite squad..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-rpg-card border border-slate-700 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-rpg-gold"
            />
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              COST IN GOLD *
            </label>
            <div className="relative">
              <Coins className="w-4 h-4 text-rpg-gold absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="5"
                step="5"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-rpg-card border border-slate-700 pl-9 pr-3 py-2 rounded text-xs text-white focus:outline-none focus:border-rpg-gold font-pixel"
              />
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1.5">
              REWARD ICON
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICONS.map((ic) => {
                const IconComponent = ic.icon;
                return (
                  <button
                    type="button"
                    key={ic.id}
                    onClick={() => {
                      playClick();
                      setSelectedIcon(ic.id);
                    }}
                    className={`p-2 rounded flex flex-col items-center justify-center border transition-all ${
                      selectedIcon === ic.id
                        ? 'bg-rpg-card border-rpg-gold text-rpg-gold shadow-glow-gold'
                        : 'bg-rpg-card/60 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-pixel">{ic.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pixel btn-pixel-gold py-2.5 text-xs flex items-center justify-center space-x-2 mt-2"
          >
            <Coins className="w-4 h-4" />
            <span>{loading ? 'FORGING...' : 'INSCRIBE REWARD'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
