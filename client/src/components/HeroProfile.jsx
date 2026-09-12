import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Brain,
  Heart,
  Wind,
  Award,
  Package,
  CheckCircle,
  Coins,
  Sparkles,
  Palette,
  Check,
  Code,
  BookOpen,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import api from '../services/api';

export const HeroProfile = () => {
  const { hero, updateHero, updateTheme } = useAuth();
  const { playClick, playCoin, playQuestComplete } = useSound();
  const [selectedTitle, setSelectedTitle] = useState(hero?.title || 'Novice Adventurer');
  const [editingTitle, setEditingTitle] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState('');
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/shop/inventory');
        if (res.data.success) {
          setInventory(res.data.inventory);
        }
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    };
    fetchInventory();
  }, []);

  if (!hero) return null;

  const handleTitleChange = async (title) => {
    playClick();
    setSelectedTitle(title);
    try {
      const res = await api.patch('/auth/profile', { title });
      if (res.data.success) {
        updateHero(res.data.user || res.data.hero);
        setEditingTitle(false);
      }
    } catch (err) {
      console.error('Failed to equip title:', err);
    }
  };

  const handleThemeChange = async (theme) => {
    playClick();
    await updateTheme(theme);
  };

  const handleRedeemVoucher = async (itemId) => {
    playQuestComplete();
    try {
      const res = await api.post(`/shop/inventory/${itemId}/redeem`);
      if (res.data.success) {
        setInventory((prev) =>
          prev.map((i) => (i._id === itemId ? { ...i, used: true, usedAt: new Date() } : i))
        );
        setRedeemMessage(res.data.message);
        setTimeout(() => setRedeemMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to redeem voucher:', err);
    }
  };

  const CLASS_LORE = {
    Warrior: {
      desc: 'Master of physical endurance and discipline. Thrives when tackling physical challenges.',
      perk: '+15% bonus XP when conquering Strength Quests.'
    },
    Mage: {
      desc: 'Seeker of deep knowledge and focus. Bends intellectual challenges to their will.',
      perk: '+15% bonus XP when conquering Intelligence Quests.'
    },
    Rogue: {
      desc: 'Swift, agile, and efficient. Eliminates chores and daily friction.',
      perk: '+15% bonus XP when conquering Agility Quests.'
    },
    Paladin: {
      desc: 'Guardian of wellness and integrity. Derives power from recovery, hydration, and sleep.',
      perk: '+15% bonus XP when conquering Vitality Quests.'
    }
  };

  const currentLore = CLASS_LORE[hero.heroClass] || CLASS_LORE.Warrior;

  const themes = [
    { id: 'dark-fantasy', name: 'Dark Fantasy', colors: 'from-slate-900 to-purple-950 border-rpg-gold' },
    { id: 'castle-theme', name: 'Castle Theme', colors: 'from-slate-900 to-amber-950 border-amber-500' },
    { id: 'night-theme', name: 'Night Theme', colors: 'from-slate-900 to-indigo-950 border-indigo-400' },
    { id: 'classic-retro', name: 'Classic 16-Bit', colors: 'from-slate-900 to-blue-950 border-sky-400' },
    { id: 'emerald-forest', name: 'Emerald Forest', colors: 'from-slate-900 to-emerald-950 border-emerald-400' },
    { id: 'crimson-dungeon', name: 'Crimson Dungeon', colors: 'from-slate-900 to-rose-950 border-rose-500' }
  ];

  const attributes = [
    {
      name: 'Strength',
      abbr: 'STR',
      category: 'Gym',
      value: hero.stats?.strength || 10,
      icon: Dumbbell,
      color: 'text-red-400',
      bg: 'bg-red-500',
      desc: 'Increased by Gym & Physical Workouts'
    },
    {
      name: 'Intellect',
      abbr: 'INT',
      category: 'Coding',
      value: hero.stats?.intellect || 10,
      icon: Code,
      color: 'text-sky-400',
      bg: 'bg-sky-500',
      desc: 'Increased by Coding & Technical Challenges'
    },
    {
      name: 'Discipline',
      abbr: 'DISC',
      category: 'Study',
      value: hero.stats?.discipline || 10,
      icon: BookOpen,
      color: 'text-amber-400',
      bg: 'bg-amber-500',
      desc: 'Increased by Study, Focus & Reading'
    },
    {
      name: 'Creativity',
      abbr: 'CREAT',
      category: 'Art',
      value: hero.stats?.creativity || 10,
      icon: Palette,
      color: 'text-purple-400',
      bg: 'bg-purple-500',
      desc: 'Increased by Art, Design & Creative Exploration'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
          <User className="w-6 h-6 mr-2 text-rpg-gold" />
          HERO CHARACTER SHEET
        </h2>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Detailed chronicle of your attributes, equipped theme, class perks, and inventory bag.
        </p>
      </div>

      {redeemMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-950 border-2 border-emerald-500 text-emerald-200 text-xs font-pixel text-center rounded"
        >
          {redeemMessage}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Hero Class & Archetype Card */}
        <div className="bg-rpg-card border-2 border-rpg-border rounded-lg p-5 space-y-4">
          <div className="text-center pb-4 border-b border-slate-800">
            <div className="w-20 h-20 mx-auto rounded-lg bg-rpg-panel border-2 border-rpg-gold flex items-center justify-center text-4xl shadow-glow-gold mb-3">
              {hero.heroClass === 'Warrior' && '⚔️'}
              {hero.heroClass === 'Mage' && '🔮'}
              {hero.heroClass === 'Rogue' && '🗡️'}
              {hero.heroClass === 'Paladin' && '🛡️'}
            </div>

            <h3 className="font-fantasy font-black text-xl text-white tracking-wide">
              {hero.username}
            </h3>
            <p className="text-xs font-pixel text-rpg-gold uppercase mt-0.5">
              Level {hero.level} {hero.heroClass}
            </p>

            <div className="mt-3 flex items-center justify-center space-x-1 bg-rpg-panel border border-slate-700 py-1 px-3 rounded">
              <Award className="w-3.5 h-3.5 text-rpg-purple-light" />
              <span className="text-xs font-sans text-slate-300">
                "{hero.title || 'Novice Adventurer'}"
              </span>
            </div>
          </div>

          {/* Equipped Theme Selector */}
          <div>
            <div className="flex items-center space-x-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-rpg-gold" />
              <span className="font-pixel text-[10px] text-slate-300 uppercase">
                EQUIPPED REALM THEME
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => handleThemeChange(th.id)}
                  className={`p-2 rounded text-left border transition-all ${
                    (hero.equippedTheme || 'dark-fantasy') === th.id
                      ? 'border-rpg-gold bg-rpg-panel text-white shadow-glow-gold'
                      : 'border-slate-800 bg-rpg-panel/50 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className="block font-pixel text-[9px] font-bold">{th.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Class Lore & Perk */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <span className="font-pixel text-[10px] text-slate-400 uppercase">ARCHETYPE PATH:</span>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                {currentLore.desc}
              </p>
            </div>

            <div className="p-3 bg-rpg-panel/80 border border-purple-900/60 rounded">
              <span className="font-pixel text-[10px] text-rpg-purple-light uppercase block mb-1">
                SPECIALIZATION PERK:
              </span>
              <p className="text-xs text-slate-200 font-sans font-medium">
                {currentLore.perk}
              </p>
            </div>
          </div>

          {/* Titles */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-pixel text-[10px] text-slate-400">EQUIP TITLE</span>
              <button
                onClick={() => setEditingTitle(!editingTitle)}
                className="text-[10px] font-pixel text-rpg-gold hover:underline"
              >
                {editingTitle ? 'CLOSE' : 'CHANGE'}
              </button>
            </div>

            {editingTitle ? (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {hero.titles?.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleTitleChange(t)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between border ${
                      hero.title === t
                        ? 'bg-rpg-panel border-rpg-gold text-rpg-gold'
                        : 'bg-rpg-panel/50 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{t}</span>
                    {hero.title === t && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-sans">
                Advance Hero Levels to unlock legendary Guild Titles.
              </p>
            )}
          </div>
        </div>

        {/* Center / Right Columns: Attributes & Standalone Inventory */}
        <div className="md:col-span-2 space-y-6">
          {/* Attributes Matrix */}
          <div className="bg-rpg-card border-2 border-rpg-border rounded-lg p-5">
            <h4 className="font-fantasy font-bold text-base text-white tracking-wide mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-rpg-gold" />
              RPG ATTRIBUTES & MASTERY
            </h4>

            <div className="space-y-4">
              {attributes.map((attr) => {
                const Icon = attr.icon;
                const statVal = Math.round(attr.value);
                const maxDisplay = Math.max(50, statVal + 15);
                const percentage = Math.min(100, Math.round((statVal / maxDisplay) * 100));

                return (
                  <div key={attr.abbr} className="bg-rpg-panel/70 border border-slate-800 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <Icon className={`w-4 h-4 ${attr.color}`} />
                        <span className="font-pixel text-xs text-white">
                          {attr.name} ({attr.abbr})
                        </span>
                      </div>
                      <span className="font-pixel text-xs text-white font-bold">
                        {attr.value} PTS
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-900 rounded overflow-hidden p-0.5 border border-slate-800">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full ${attr.bg} rounded-sm transition-all duration-500`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 font-sans">{attr.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standalone Inventory Bag */}
          <div className="bg-rpg-card border-2 border-rpg-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-fantasy font-bold text-base text-white tracking-wide flex items-center">
                <Package className="w-4 h-4 mr-2 text-rpg-purple-light" />
                HERO INVENTORY SATCHEL ({inventory.length})
              </h4>
            </div>

            {inventory.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center font-sans">
                Your satchel is empty. Visit the Guild Armory to acquire potions or forge custom reward vouchers!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto">
                {inventory.map((item) => (
                  <div
                    key={item._id}
                    className={`p-3 rounded border flex items-start justify-between gap-3 ${
                      item.used
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                        : 'bg-rpg-panel border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-fantasy font-bold text-xs text-white">
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {item.description}
                        </p>
                      )}
                      <span className="inline-block text-[9px] font-pixel text-slate-500 mt-1 uppercase">
                        {item.category}
                      </span>
                    </div>

                    {item.category === 'custom_reward' && !item.used && (
                      <button
                        onClick={() => handleRedeemVoucher(item._id)}
                        className="btn-pixel btn-pixel-emerald text-[9px] py-1 px-2 flex-shrink-0"
                      >
                        REDEEM
                      </button>
                    )}

                    {item.used && (
                      <span className="text-[10px] font-pixel text-slate-500 uppercase flex-shrink-0">
                        REDEEMED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
