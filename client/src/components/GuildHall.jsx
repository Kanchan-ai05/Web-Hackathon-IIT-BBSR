import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Swords,
  Scroll,
  Flame,
  ShoppingBag,
  Plus,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuests } from '../context/QuestContext';
import { useSound } from '../context/SoundContext';
import { HeroBanner } from './HeroBanner';
import { QuestCard } from './QuestCard';
import { BossQuestCard } from './BossQuestCard';
import { CreateQuestModal } from './CreateQuestModal';
import api from '../services/api';

export const GuildHall = ({ onNavigateTab }) => {
  const { hero } = useAuth();
  const { quests } = useQuests();
  const { playClick } = useSound();
  const [modalOpen, setModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/stats/overview');
        if (res.data.success) {
          setAnalytics(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load campaign analytics:', err);
      }
    };
    fetchAnalytics();
  }, [quests]);

  // Separate daily quests and active main quests
  const dailyQuests = quests.filter((q) => q.questType === 'daily');
  const activeMainQuests = quests.filter(
    (q) => q.questType !== 'daily' && !q.completed
  ).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Hero Banner HUD */}
      <HeroBanner />

      {/* Guild Campaign Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-rpg-card border-2 border-rpg-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-pixel text-[10px]">CONQUERED</span>
          </div>
          <span className="font-pixel text-xl sm:text-2xl text-white font-bold">
            {analytics?.totalCompleted ?? 0}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1 font-sans">
            Completed quests
          </span>
        </div>

        <div className="bg-rpg-card border-2 border-rpg-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="font-pixel text-[10px]">IN PROGRESS</span>
          </div>
          <span className="font-pixel text-xl sm:text-2xl text-white font-bold">
            {analytics?.totalPending ?? 0}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1 font-sans">
            Active in log
          </span>
        </div>

        <div className="bg-rpg-card border-2 border-rpg-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-pixel text-[10px]">DISCIPLINE</span>
          </div>
          <span className="font-pixel text-xl sm:text-2xl text-amber-400 font-bold">
            {hero?.streak ?? 0} DAYS
          </span>
          <span className="block text-[11px] text-slate-500 mt-1 font-sans">
            Daily habit streak
          </span>
        </div>

        <div className="bg-rpg-card border-2 border-rpg-border p-4 rounded-lg">
          <div className="flex items-center space-x-2 text-slate-400 mb-1">
            <Trophy className="w-4 h-4 text-rpg-purple-light" />
            <span className="font-pixel text-[10px]">WIN RATE</span>
          </div>
          <span className="font-pixel text-xl sm:text-2xl text-rpg-purple-light font-bold">
            {analytics?.completionRate ?? 0}%
          </span>
          <span className="block text-[11px] text-slate-500 mt-1 font-sans">
            Campaign efficiency
          </span>
        </div>
      </div>

      {/* Main Content: Daily Campaigns & Active Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Daily Habits Checklist */}
        <div className="bg-rpg-panel border-2 border-rpg-border rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="font-fantasy font-bold text-base text-white tracking-wide">
                TODAY'S DAILY HABITS
              </h3>
            </div>
            <button
              onClick={() => {
                playClick();
                setModalOpen(true);
              }}
              className="text-[10px] font-pixel text-rpg-gold hover:underline flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW HABIT</span>
            </button>
          </div>

          {dailyQuests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 font-sans">
              No daily habits forged yet. Inscribe daily rituals to maintain your Hero Streak!
            </p>
          ) : (
            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <QuestCard key={quest._id} quest={quest} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Main Quests & Boss Raids */}
        <div className="bg-rpg-panel border-2 border-rpg-border rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Swords className="w-5 h-5 text-rpg-gold" />
              <h3 className="font-fantasy font-bold text-base text-white tracking-wide">
                PRIORITY CAMPAIGNS
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('quests')}
              className="text-[10px] font-pixel text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <span>VIEW ALL</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activeMainQuests.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8 font-sans">
              No active priority quests in your log! Visit the Quest Log to forge new conquests.
            </p>
          ) : (
            <div className="space-y-3">
              {activeMainQuests.map((quest) =>
                quest.questType === 'boss' ? (
                  <BossQuestCard key={quest._id} quest={quest} />
                ) : (
                  <QuestCard key={quest._id} quest={quest} />
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Armory Call to Action Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-rpg-panel to-purple-950/60 border-2 border-rpg-gold/60 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-glow-gold">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded bg-rpg-card border border-rpg-gold flex items-center justify-center text-2xl flex-shrink-0">
            💰
          </div>
          <div>
            <h4 className="font-fantasy font-bold text-white text-base">
              HAVE SURPLUS GOLD IN YOUR SATCHEL?
            </h4>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Visit the Guild Armory to brew potions, equip gear, or redeem custom real-life reward scrolls!
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            playClick();
            onNavigateTab('shop');
          }}
          className="btn-pixel btn-pixel-gold text-xs py-2 px-4 whitespace-nowrap"
        >
          ENTER SHOP
        </button>
      </div>

      {/* Modal */}
      <CreateQuestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
