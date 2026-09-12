import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Shield,
  Brain,
  Wind,
  Heart,
  UserCheck,
  Lock,
  Mail,
  User,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const AuthModal = () => {
  const { login, register, authError } = useAuth();
  const { playClick, playLevelUp } = useSound();

  const [mode, setMode] = useState('register'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroClass, setHeroClass] = useState('Warrior');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const classes = [
    {
      id: 'Warrior',
      name: 'Warrior',
      emoji: '⚔️',
      stat: 'Strength',
      icon: Shield,
      color: 'border-red-500 text-red-400 bg-red-950/40',
      desc: '+15% XP on physical workouts & fitness'
    },
    {
      id: 'Mage',
      name: 'Mage',
      emoji: '🔮',
      stat: 'Intelligence',
      icon: Brain,
      color: 'border-purple-500 text-purple-400 bg-purple-950/40',
      desc: '+15% XP on coding, study & reading'
    },
    {
      id: 'Rogue',
      name: 'Rogue',
      emoji: '🗡️',
      stat: 'Agility',
      icon: Wind,
      color: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
      desc: '+15% XP on speed, errands & daily chores'
    },
    {
      id: 'Paladin',
      name: 'Paladin',
      emoji: '🛡️',
      stat: 'Vitality',
      icon: Heart,
      color: 'border-amber-500 text-amber-400 bg-amber-950/40',
      desc: '+15% XP on health, hydration & sleep'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSubmitting(true);
    playClick();

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setLocalError(res.message);
      } else {
        playLevelUp();
      }
    } else {
      if (!username.trim()) {
        setLocalError('Please choose a Hero Name.');
        setSubmitting(false);
        return;
      }
      const res = await register(username, email, password, heroClass, heroClass.toLowerCase());
      if (!res.success) {
        setLocalError(res.message);
      } else {
        playLevelUp();
      }
    }
    setSubmitting(false);
  };

  const handleDemoLogin = async () => {
    playClick();
    setSubmitting(true);
    setLocalError('');

    // Try logging in as demo Hero first
    const demoEmail = 'hero@liferpg.realm';
    const demoPass = 'rpghero123';

    let res = await login(demoEmail, demoPass);
    if (!res.success) {
      // If not registered yet, register demo hero!
      res = await register('Sir Arthur', demoEmail, demoPass, 'Warrior', 'warrior');
    }

    if (res.success) {
      playLevelUp();
    } else {
      setLocalError(res.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-rpg-panel border-4 border-rpg-border rounded-xl shadow-2xl p-6 sm:p-8 relative overflow-hidden"
      >
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-rpg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rpg-purple/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6 relative z-10">
          <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-rpg-gold flex items-center justify-center shadow-glow-gold">
            <Swords className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-fantasy font-black tracking-wider text-white">
            LIFE <span className="text-rpg-gold">RPG</span>
          </h1>
          <p className="font-pixel text-[10px] text-rpg-gold-light mt-1 tracking-widest">
            GUILD ENLISTMENT GATEWAY
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-6 bg-rpg-card p-1 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => {
              playClick();
              setMode('register');
              setLocalError('');
            }}
            className={`py-2 text-center font-pixel text-xs rounded transition-all ${
              mode === 'register'
                ? 'bg-rpg-panel text-rpg-gold border border-rpg-gold/80 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ENLIST HERO
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setMode('login');
              setLocalError('');
            }}
            className={`py-2 text-center font-pixel text-xs rounded transition-all ${
              mode === 'login'
                ? 'bg-rpg-panel text-rpg-gold border border-rpg-gold/80 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ENTER GUILD
          </button>
        </div>

        {(localError || authError) && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-500 rounded text-rose-300 text-xs font-pixel">
            {localError || authError}
          </div>
        )}

        {/* Enlistment / Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'register' && (
            <div>
              <label className="block font-pixel text-[10px] text-slate-300 mb-1">
                HERO NAME *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sir Arthur, Shadowblade"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-rpg-card border border-slate-700 pl-9 pr-3 py-2 rounded text-sm text-white focus:outline-none focus:border-rpg-gold"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              GUILD EMAIL *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="hero@realm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-rpg-card border border-slate-700 pl-9 pr-3 py-2 rounded text-sm text-white focus:outline-none focus:border-rpg-gold"
              />
            </div>
          </div>

          <div>
            <label className="block font-pixel text-[10px] text-slate-300 mb-1">
              PASSCODE *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="At least 6 runes"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-rpg-card border border-slate-700 pl-9 pr-3 py-2 rounded text-sm text-white focus:outline-none focus:border-rpg-gold"
              />
            </div>
          </div>

          {/* Class Archetype Selection (Only during enlistment) */}
          {mode === 'register' && (
            <div>
              <label className="block font-pixel text-[10px] text-slate-300 mb-1.5">
                SELECT CLASS ARCHETYPE
              </label>
              <div className="grid grid-cols-2 gap-2">
                {classes.map((cls) => {
                  const Icon = cls.icon;
                  const isSelected = heroClass === cls.id;
                  return (
                    <button
                      type="button"
                      key={cls.id}
                      onClick={() => {
                        playClick();
                        setHeroClass(cls.id);
                      }}
                      className={`p-2.5 rounded text-left border transition-all ${
                        isSelected
                          ? `border-rpg-gold ${cls.color} shadow-glow-gold`
                          : 'border-slate-800 bg-rpg-card/60 hover:border-slate-600 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{cls.emoji}</span>
                        <div>
                          <span className="font-fantasy font-bold text-xs text-white block">
                            {cls.name}
                          </span>
                          <span className="text-[10px] font-pixel text-slate-400">
                            {cls.stat}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans leading-tight">
                        {cls.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-pixel btn-pixel-gold py-3 text-xs flex items-center justify-center space-x-2 mt-2"
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {submitting
                ? 'INSCRIBING GUILD RECORD...'
                : mode === 'register'
                ? 'BEGIN QUESTING'
                : 'ENTER GUILD HALL'}
            </span>
          </button>

          {/* Quick Demo Hero Login */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={submitting}
              className="w-full btn-pixel btn-pixel-dark py-2.5 text-[10px] flex items-center justify-center space-x-2 text-slate-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-rpg-gold" />
              <span>INSTANT PLAY (DEMO HERO: SIR ARTHUR)</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
