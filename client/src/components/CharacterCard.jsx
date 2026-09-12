import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  Coins,
  Sparkles,
  Dumbbell,
  Code,
  BookOpen,
  Palette,
  Award,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CharacterCard = () => {
  const { hero } = useAuth();
  if (!hero) return null;

  const currentXp = hero.xp !== undefined ? hero.xp : (hero.currentXp || 0);
  const maxXp = hero.maxXp || Math.floor(100 * Math.pow(hero.level || 1, 1.5));
  const xpPercentage = Math.min(100, Math.round((currentXp / maxXp) * 100));

  const statsList = [
    {
      id: 'strength',
      name: 'Strength',
      category: 'Gym',
      value: hero.stats?.strength || 10,
      icon: Dumbbell,
      color: 'text-rose-400',
      barColor: 'from-rose-600 via-red-500 to-rose-400',
      bgColor: 'bg-rose-950/40 border-rose-800/60',
      glow: 'shadow-glow-ruby',
      desc: 'Increased by Gym & Workouts'
    },
    {
      id: 'intellect',
      name: 'Intellect',
      category: 'Coding',
      value: hero.stats?.intellect || 10,
      icon: Code,
      color: 'text-sky-400',
      barColor: 'from-sky-600 via-cyan-500 to-sky-400',
      bgColor: 'bg-sky-950/40 border-sky-800/60',
      glow: 'shadow-glow-purple',
      desc: 'Increased by Coding & Tech'
    },
    {
      id: 'discipline',
      name: 'Discipline',
      category: 'Study',
      value: hero.stats?.discipline || 10,
      icon: BookOpen,
      color: 'text-amber-400',
      barColor: 'from-amber-600 via-yellow-500 to-amber-300',
      bgColor: 'bg-amber-950/40 border-amber-800/60',
      glow: 'shadow-glow-gold',
      desc: 'Increased by Study & Reading'
    },
    {
      id: 'creativity',
      name: 'Creativity',
      category: 'Art',
      value: hero.stats?.creativity || 10,
      icon: Palette,
      color: 'text-purple-400',
      barColor: 'from-purple-600 via-fuchsia-500 to-purple-400',
      bgColor: 'bg-purple-950/40 border-purple-800/60',
      glow: 'shadow-glow-purple',
      desc: 'Increased by Art & Design'
    }
  ];

  const getClassTheme = (cls) => {
    switch (cls) {
      case 'Warrior':
        return { border: 'border-red-500/70', badgeBg: 'bg-red-950/80 text-red-300', emoji: '⚔️' };
      case 'Mage':
        return { border: 'border-purple-500/70', badgeBg: 'bg-purple-950/80 text-purple-300', emoji: '🔮' };
      case 'Rogue':
        return { border: 'border-emerald-500/70', badgeBg: 'bg-emerald-950/80 text-emerald-300', emoji: '🗡️' };
      case 'Paladin':
        return { border: 'border-amber-500/70', badgeBg: 'bg-amber-950/80 text-amber-300', emoji: '🛡️' };
      default:
        return { border: 'border-slate-500', badgeBg: 'bg-slate-800 text-slate-200', emoji: '⚔️' };
    }
  };

  const theme = getClassTheme(hero.heroClass);

  return (
    <div className="relative overflow-hidden bg-rpg-panel border-2 border-rpg-border rounded-xl p-5 sm:p-7 mb-8 shadow-2xl">
      {/* Mystic background ambient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rpg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rpg-purple/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header: Hero Profile, Badges, Gold & Streaks */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Hero Avatar & Circular Level Badge */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Circular Level Badge */}
            <div className="relative flex-shrink-0">
              {/* Orbiting celestial dashed ring */}
              <div className="absolute -inset-1.5 rounded-full border-2 border-dashed border-rpg-gold/60 animate-[spin_20s_linear_infinite] pointer-events-none" />

              {/* Glowing circular medallion */}
              <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full p-1 bg-gradient-to-tr from-amber-600 via-rpg-gold to-yellow-200 shadow-glow-gold-lg flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-950/90 border-2 border-rpg-gold flex flex-col items-center justify-center text-center">
                  <span className="font-pixel text-[8px] sm:text-[9px] text-rpg-gold tracking-widest font-bold">
                    LEVEL
                  </span>
                  <span className="font-pixel text-xl sm:text-2xl text-white font-black leading-none drop-shadow-[0_2px_4px_rgba(245,158,11,0.8)]">
                    {hero.level}
                  </span>
                  <span className="text-[10px] sm:text-xs text-rpg-gold mt-0.5">
                    ★
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Emoji & Identity Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={hero.heroClass}>
                  {theme.emoji}
                </span>
                <h1 className="text-xl sm:text-3xl font-fantasy font-black tracking-wide text-white drop-shadow-md">
                  {hero.username}
                </h1>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-pixel uppercase font-bold border shadow-sm ${theme.badgeBg}`}>
                  {hero.heroClass}
                </span>
              </div>

              <div className="flex items-center space-x-2 mt-1.5">
                <Award className="w-4 h-4 text-rpg-gold" />
                <span className="text-xs sm:text-sm text-slate-200 font-sans font-medium tracking-wide">
                  "{hero.title || 'Novice Adventurer'}"
                </span>
              </div>

              {/* Badges: Level & Theme */}
              <div className="flex items-center space-x-2 mt-2">
                <span className="font-pixel text-[9px] px-2.5 py-0.5 rounded bg-rpg-card/90 border border-slate-700 text-slate-300 shadow-sm flex items-center space-x-1">
                  <span className="text-rpg-gold">⚔️</span>
                  <span>REALM: {hero.equippedTheme || 'dark-fantasy'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick HUD Counters: Gold, Daily Streak, Longest Streak */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Gold Counter */}
            <motion.div
              key={hero.gold}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="flex items-center space-x-2 bg-rpg-card border-2 border-rpg-gold px-3.5 py-2 rounded-lg shadow-glow-gold"
            >
              <Coins className="w-5 h-5 text-rpg-gold animate-bounce-subtle" />
              <div>
                <span className="block text-[9px] font-pixel text-slate-400">HERO GOLD</span>
                <span className="font-pixel text-sm text-rpg-gold font-bold">
                  {hero.gold || 0} G
                </span>
              </div>
            </motion.div>

            {/* Daily Streak */}
            <div className="flex items-center space-x-2 bg-rpg-card border-2 border-amber-500/60 px-3.5 py-2 rounded-lg">
              <Flame className="w-5 h-5 text-amber-500 animate-pulse-fast" />
              <div>
                <span className="block text-[9px] font-pixel text-slate-400">DAILY STREAK</span>
                <span className="font-pixel text-sm text-amber-400 font-bold">
                  {hero.streak || 0} DAYS
                </span>
              </div>
            </div>

            {/* Longest Streak Record */}
            <div className="flex items-center space-x-2 bg-rpg-card border-2 border-purple-500/60 px-3.5 py-2 rounded-lg">
              <Trophy className="w-5 h-5 text-rpg-purple-light" />
              <div>
                <span className="block text-[9px] font-pixel text-slate-400">LONGEST STREAK</span>
                <span className="font-pixel text-sm text-rpg-purple-light font-bold">
                  {hero.longestStreak || hero.streak || 0} DAYS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Animated XP Bar: Non-Linear Leveling Formula */}
        <div className="bg-rpg-card/90 border border-slate-700/80 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-rpg-purple-light" />
              <span className="font-pixel text-xs text-white">HERO LEVEL {hero.level} PROGRESS</span>
              <span className="hidden sm:inline-block font-pixel text-[9px] text-slate-400 bg-rpg-panel px-1.5 py-0.5 rounded border border-slate-700">
                XP REQUIRED: 100 × LEVEL^1.5
              </span>
            </div>
            <span className="font-pixel text-xs text-rpg-purple-light font-bold">
              {currentXp} / {maxXp} XP ({xpPercentage}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={currentXp}
            aria-valuemin="0"
            aria-valuemax={maxXp}
            aria-label="Experience Points progression bar"
            className="relative h-6 w-full bg-slate-950 border-2 border-slate-700 rounded-md overflow-hidden p-0.5"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-purple-700 via-rpg-purple to-purple-400 rounded-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Four Animated Core Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-fantasy font-bold text-sm text-white tracking-wider flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-rpg-gold" />
              CORE RPG STAT MASTERY
            </h3>
            <span className="text-[10px] font-pixel text-slate-400">
              Increase stats by completing matching quests
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {statsList.map((stat) => {
              const Icon = stat.icon;
              const val = Math.round(stat.value);
              // Max visual baseline at 50 for satisfying progress bar fill
              const maxDisplay = Math.max(50, val + 10);
              const percentage = Math.min(100, Math.round((val / maxDisplay) * 100));

              return (
                <div
                  key={stat.id}
                  className={`relative p-3.5 rounded-lg border transition-all ${stat.bgColor} hover:border-slate-500`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded bg-rpg-card border border-slate-700 ${stat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-pixel text-[11px] text-white block">
                          {stat.name}
                        </span>
                        <span className={`text-[9px] font-pixel ${stat.color}`}>
                          +{stat.category}
                        </span>
                      </div>
                    </div>

                    <motion.span
                      key={val}
                      initial={{ scale: 1.25 }}
                      animate={{ scale: 1 }}
                      className="font-pixel text-sm text-white font-bold"
                    >
                      {val}
                    </motion.span>
                  </div>

                  {/* Animated Stat Meter */}
                  <div className="h-2.5 w-full bg-slate-950 rounded overflow-hidden p-0.5 border border-slate-800 mt-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${stat.barColor} rounded-sm`}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-sans mt-1.5">
                    {stat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equipped Loadout Bar */}
        {(hero.equippedGear?.weapon || hero.equippedGear?.hat || hero.equippedGear?.pet || hero.equippedGear?.badge || hero.equippedTheme) && (
          <div className="bg-rpg-card/60 border border-slate-700/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <span className="font-pixel text-[10px] text-slate-400">EQUIPPED LOADOUT:</span>
            <div className="flex flex-wrap items-center gap-2">
              {hero.equippedGear?.weapon && (
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600 text-amber-300">
                  ⚔️ {hero.equippedGear.weapon}
                </span>
              )}
              {hero.equippedGear?.hat && (
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-sky-950/80 border border-sky-600 text-sky-300">
                  ✨ {hero.equippedGear.hat}
                </span>
              )}
              {hero.equippedGear?.pet && (
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-purple-950/80 border border-purple-600 text-purple-300">
                  🐾 {hero.equippedGear.pet}
                </span>
              )}
              {hero.equippedGear?.badge && (
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600 text-emerald-300">
                  🎖️ {hero.equippedGear.badge}
                </span>
              )}
              {hero.equippedTheme && (
                <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-300">
                  🏰 {hero.equippedTheme}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
