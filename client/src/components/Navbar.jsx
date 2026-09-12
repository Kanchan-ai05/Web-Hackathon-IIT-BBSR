import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Scroll,
  ShoppingBag,
  User,
  Trophy,
  Volume2,
  VolumeX,
  LogOut,
  Menu,
  X,
  Coins,
  Shield,
  Package
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';

export const Navbar = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { hero, isGuest, logout } = useAuth();
  const { isMuted, toggleSound, playClick } = useSound();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'guild', label: 'Guild Hall', icon: Swords },
    { id: 'quests', label: 'Quests', icon: Scroll },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'hero', label: 'Hero Sheet', icon: User },
    { id: 'halloffame', label: 'Hall of Fame', icon: Trophy }
  ];

  const handleTabSelect = (id) => {
    playClick();
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  const handleSoundToggle = () => {
    toggleSound();
  };

  return (
    <nav className="sticky top-0 z-40 bg-rpg-panel/95 backdrop-blur border-b-2 border-rpg-border shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div
            onClick={() => handleTabSelect('guild')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-600 to-amber-800 border-2 border-rpg-gold flex items-center justify-center shadow-glow-gold group-hover:scale-105 transition-transform">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-fantasy font-black text-lg sm:text-xl tracking-wider text-white flex items-center">
                LIFE <span className="text-rpg-gold ml-1">RPG</span>
              </span>
              <span className="hidden sm:block text-[10px] font-pixel text-slate-400">
                16-BIT REALM
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md font-pixel text-xs tracking-wider transition-all duration-150 ${
                    isActive
                      ? 'bg-rpg-card text-rpg-gold border border-rpg-gold shadow-glow-gold'
                      : 'text-slate-300 hover:text-white hover:bg-rpg-card/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rpg-gold' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Hero Stats HUD & Controls */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {hero && (
              <>
                {/* Hero Level Badge */}
                <div className="hidden sm:flex items-center space-x-1.5 bg-rpg-card border border-rpg-purple-light/40 px-2.5 py-1 rounded">
                  <Shield className="w-3.5 h-3.5 text-rpg-purple-light" />
                  <span className="font-pixel text-[11px] text-rpg-purple-light font-bold">
                    LVL {hero.level}
                  </span>
                </div>

                {/* Hero Gold Counter */}
                <motion.div
                  key={hero.gold}
                  initial={{ scale: 1.15 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-1.5 bg-rpg-card border border-rpg-gold/50 px-2.5 py-1 rounded shadow-sm"
                >
                  <Coins className="w-4 h-4 text-rpg-gold animate-bounce-subtle" />
                  <span className="font-pixel text-xs text-rpg-gold font-bold">
                    {hero.gold}
                  </span>
                </motion.div>
              </>
            )}

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              title={isMuted ? 'Unmute 8-Bit Chimes' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 text-slate-300 hover:text-rpg-gold bg-rpg-card border border-slate-700 rounded transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-rpg-gold" />
              )}
            </button>

            {/* Guest / Account Action */}
            {isGuest ? (
              <button
                onClick={() => {
                  playClick();
                  if (onOpenAuth) onOpenAuth();
                }}
                title="Enlist or Sign In"
                aria-label="Enlist or Sign In"
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-amber-600/30 to-amber-900/30 border border-rpg-gold/70 hover:border-rpg-gold px-2.5 py-1.5 rounded text-rpg-gold hover:text-white font-pixel text-[10px] transition-all shadow-sm hover:shadow-glow-gold"
              >
                <span>DEMO HERO</span>
                <span className="text-[8px] text-amber-200">(SIGN IN)</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playClick();
                  logout();
                }}
                title="Leave Guild"
                aria-label="Leave Guild"
                className="hidden sm:flex p-2 text-slate-400 hover:text-rpg-ruby bg-rpg-card border border-slate-700 hover:border-rpg-ruby/60 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Mobile menu hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden p-2 text-slate-300 hover:text-white bg-rpg-card border border-slate-700 rounded"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-rpg-card border-b border-rpg-border px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabSelect(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md font-pixel text-xs tracking-wider transition-colors ${
                  isActive
                    ? 'bg-rpg-panel text-rpg-gold border border-rpg-gold'
                    : 'text-slate-300 hover:bg-rpg-panel/50'
                }`}
              >
                <Icon className="w-4 h-4 text-rpg-gold" />
                <span>{item.label}</span>
              </button>
            );
          })}
          {isGuest ? (
            <button
              onClick={() => {
                playClick();
                setMobileMenuOpen(false);
                if (onOpenAuth) onOpenAuth();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md font-pixel text-xs text-rpg-gold bg-rpg-panel border border-rpg-gold transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Enlist Hero / Sign In</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playClick();
                logout();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-md font-pixel text-xs text-rpg-ruby hover:bg-rpg-panel/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Guild</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
