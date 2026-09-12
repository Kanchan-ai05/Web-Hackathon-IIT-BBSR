import React, { useState } from 'react';
import {
  Plus,
  Search,
  Scroll,
  Flame,
  Swords,
  Skull,
  Dumbbell,
  Code,
  BookOpen,
  Palette
} from 'lucide-react';
import { useQuests } from '../context/QuestContext';
import { useSound } from '../context/SoundContext';
import { QuestCard } from './QuestCard';
import { BossQuestCard } from './BossQuestCard';
import { SkeletonLoader } from './SkeletonLoader';
import { CreateQuestModal } from './CreateQuestModal';

export const QuestBoard = () => {
  const {
    quests,
    loadingQuests,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterDifficulty,
    setFilterDifficulty,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery
  } = useQuests();

  const { playClick } = useSound();
  const [modalOpen, setModalOpen] = useState(false);

  const typeTabs = [
    { id: 'all', label: 'All Quests', icon: Scroll },
    { id: 'daily', label: 'Daily Habits', icon: Flame },
    { id: 'todo', label: 'Main Quests', icon: Swords },
    { id: 'boss', label: 'Boss Raids', icon: Skull }
  ];

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'Gym', label: '🏋️ Gym (+Strength)' },
    { id: 'Coding', label: '💻 Coding (+Intellect)' },
    { id: 'Study', label: '📚 Study (+Discipline)' },
    { id: 'Art', label: '🎨 Art (+Creativity)' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-fantasy font-black tracking-wide text-white flex items-center">
            <Scroll className="w-6 h-6 mr-2 text-rpg-gold" />
            QUEST LOG
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Conquer quests in Gym, Coding, Study, and Art to advance your stats and level up!
          </p>
        </div>

        {/* Forge Quest Primary Action Button */}
        <button
          onClick={() => {
            playClick();
            setModalOpen(true);
          }}
          className="btn-pixel btn-pixel-gold flex items-center justify-center space-x-2 py-2.5 px-4 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>FORGE QUEST</span>
        </button>
      </div>

      {/* Quest Classification Filter Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-2 border-b border-slate-800">
        {typeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playClick();
                setFilterType(tab.id);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-t font-pixel text-[11px] whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-rpg-card text-rpg-gold border-t-2 border-rpg-gold border-x border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-rpg-card/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rpg-gold' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Search & Category Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-rpg-card/60 border border-slate-800 p-3 rounded-lg">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search quest parchment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-rpg-panel border border-slate-700 pl-9 pr-3 py-1.5 rounded text-xs text-white focus:outline-none focus:border-rpg-gold"
          />
        </div>

        {/* Category Dropdown Filter */}
        <select
          value={filterCategory}
          onChange={(e) => {
            playClick();
            setFilterCategory(e.target.value);
          }}
          className="bg-rpg-panel border border-slate-700 text-xs font-pixel text-slate-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-rpg-gold"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Status Filter (Active / Completed / All) */}
        <div className="flex items-center space-x-1">
          {['all', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => {
                playClick();
                setFilterStatus(status);
              }}
              className={`font-pixel text-[10px] px-2.5 py-1.5 rounded uppercase transition-colors ${
                filterStatus === status
                  ? 'bg-rpg-panel text-rpg-gold border border-rpg-gold/70'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <select
          value={filterDifficulty}
          onChange={(e) => {
            playClick();
            setFilterDifficulty(e.target.value);
          }}
          className="bg-rpg-panel border border-slate-700 text-xs font-pixel text-slate-300 py-1.5 px-2.5 rounded focus:outline-none focus:border-rpg-gold uppercase"
        >
          <option value="all">ALL RANKS</option>
          <option value="trivial">Trivial</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="epic">Epic</option>
        </select>
      </div>

      {/* Quests List */}
      {loadingQuests ? (
        <SkeletonLoader count={4} />
      ) : quests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-rpg-card/40 border-2 border-dashed border-slate-800 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700 text-2xl">
            📜
          </div>
          <h3 className="font-fantasy text-lg font-bold text-slate-300 mb-1">
            No Quests Inscribed
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-sans">
            Your journal is clear in this category. Forge a new quest to advance your stats and level up!
          </p>
          <button
            onClick={() => {
              playClick();
              setModalOpen(true);
            }}
            className="btn-pixel btn-pixel-gold text-xs py-2 px-4"
          >
            FORGE FIRST QUEST
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((quest) =>
            quest.questType === 'boss' ? (
              <div key={quest._id} className="md:col-span-2">
                <BossQuestCard quest={quest} />
              </div>
            ) : (
              <QuestCard key={quest._id} quest={quest} />
            )
          )}
        </div>
      )}

      {/* Create Quest Modal */}
      <CreateQuestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};
