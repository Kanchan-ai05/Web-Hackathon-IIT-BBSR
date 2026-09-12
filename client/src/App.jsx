import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SoundProvider, useSound } from './context/SoundContext';
import { ToastProvider } from './context/ToastContext';
import { QuestProvider } from './context/QuestContext';
import { Navbar } from './components/Navbar';
import { SkeletonLoader } from './components/SkeletonLoader';
import { AuthModal } from './components/AuthModal';
import { FloatingRewards } from './components/FloatingRewards';
import { LevelUpModal } from './components/LevelUpModal';
import { AmbientParticles } from './components/AmbientParticles';
import { Swords, Scroll, ShoppingBag, Package, User, Trophy } from 'lucide-react';

// Lazy load heavy page views with chunk splitting
const GuildHall = React.lazy(() => import('./components/GuildHall').then((m) => ({ default: m.GuildHall })));
const QuestBoard = React.lazy(() => import('./components/QuestBoard').then((m) => ({ default: m.QuestBoard })));
const ShopPage = React.lazy(() => import('./components/ShopPage').then((m) => ({ default: m.ShopPage })));
const InventoryPage = React.lazy(() => import('./components/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const HeroProfile = React.lazy(() => import('./components/HeroProfile').then((m) => ({ default: m.HeroProfile })));
const HallOfFame = React.lazy(() => import('./components/HallOfFame').then((m) => ({ default: m.HallOfFame })));

const MainLayout = () => {
  const { hero, isAuthenticated, loading } = useAuth();
  const { playClick } = useSound();
  const [activeTab, setActiveTab] = useState('guild');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rpg-bg">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-lg bg-rpg-panel border-2 border-rpg-gold flex items-center justify-center animate-bounce shadow-glow-gold">
            <Swords className="w-8 h-8 text-rpg-gold" />
          </div>
          <p className="font-pixel text-xs text-rpg-gold tracking-wider">
            SUMMONING GUILD RECORDS...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthModal />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'guild':
        return <GuildHall onNavigateTab={setActiveTab} />;
      case 'quests':
        return <QuestBoard />;
      case 'shop':
      case 'armory':
        return <ShopPage />;
      case 'inventory':
        return <InventoryPage onNavigateToShop={() => setActiveTab('shop')} />;
      case 'hero':
        return <HeroProfile />;
      case 'halloffame':
        return <HallOfFame />;
      default:
        return <GuildHall onNavigateTab={setActiveTab} />;
    }
  };

  const mobileTabs = [
    { id: 'guild', label: 'Hall', icon: Swords },
    { id: 'quests', label: 'Quests', icon: Scroll },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'inventory', label: 'Satchel', icon: Package },
    { id: 'hero', label: 'Hero', icon: User },
    { id: 'halloffame', label: 'Fame', icon: Trophy }
  ];

  const getThemeClass = (theme) => {
    if (theme === 'castle-theme') return 'theme-castle';
    if (theme === 'night-theme') return 'theme-night';
    return '';
  };

  return (
    <div className={`min-h-screen flex flex-col bg-rpg-bg pb-20 md:pb-8 transition-colors duration-300 ${getThemeClass(hero?.equippedTheme)}`}>
      {/* Ambient background particles */}
      <AmbientParticles />

      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <React.Suspense fallback={<SkeletonLoader count={4} />}>
              {renderActiveTab()}
            </React.Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-rpg-panel/95 backdrop-blur border-t-2 border-rpg-border px-2 py-1.5 flex justify-around items-center">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setActiveTab(tab.id);
              }}
              className={`flex flex-col items-center py-1 px-2 rounded font-pixel text-[9px] transition-colors ${
                isActive
                  ? 'text-rpg-gold border-t-2 border-rpg-gold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overlay Micro-Interactions */}
      <FloatingRewards />
      <LevelUpModal />
    </div>
  );
};

export default function App() {
  return (
    <SoundProvider>
      <AuthProvider>
        <ToastProvider>
          <QuestProvider>
            <MainLayout />
          </QuestProvider>
        </ToastProvider>
      </AuthProvider>
    </SoundProvider>
  );
}
