import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSound } from './SoundContext';

const QuestContext = createContext(null);

export const QuestProvider = ({ children }) => {
  const { hero, updateHero, isAuthenticated } = useAuth();
  const { playQuestComplete, playLevelUp, playBossHit, playCoin } = useSound();

  const [quests, setQuests] = useState([]);
  const [loadingQuests, setLoadingQuests] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [floatingRewards, setFloatingRewards] = useState([]);
  const [levelUpData, setLevelUpData] = useState(null);

  const fetchQuests = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingQuests(true);
    try {
      const params = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus === 'active') params.completed = 'false';
      if (filterStatus === 'completed') params.completed = 'true';
      if (filterDifficulty !== 'all') params.difficulty = filterDifficulty;
      if (filterCategory !== 'all') params.category = filterCategory;
      if (searchQuery) params.search = searchQuery;

      const res = await api.get('/quests', { params });
      if (res.data.success) {
        setQuests(res.data.quests || res.data.tasks || []);
      }
    } catch (err) {
      console.error('Error fetching quests:', err);
    } finally {
      setLoadingQuests(false);
    }
  }, [isAuthenticated, filterType, filterStatus, filterDifficulty, filterCategory, searchQuery]);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  const triggerFloatingReward = (xp, gold, clientCoordinates, statBonus = null) => {
    const id = Date.now() + Math.random();
    const newFloater = {
      id,
      xp,
      gold,
      statBonus,
      x: clientCoordinates?.x || window.innerWidth / 2,
      y: clientCoordinates?.y || window.innerHeight / 2
    };

    setFloatingRewards((prev) => [...prev, newFloater]);

    setTimeout(() => {
      setFloatingRewards((prev) => prev.filter((item) => item.id !== id));
    }, 1200);
  };

  /**
   * Optimistic complete quest:
   * UI updates instantly:
   * - Quest marked completed
   * - XP increases immediately
   * - Gold increases immediately
   * - Hero Attribute Stats increase immediately
   */
  const completeQuest = async (questId, coordinates) => {
    const targetQuest = quests.find((q) => q._id === questId);
    if (!targetQuest || targetQuest.completed) return;

    const previousQuests = [...quests];
    const previousHero = hero ? { ...hero } : null;

    // 1. Instant Optimistic Quests Update
    setQuests((prev) =>
      prev.map((q) =>
        q._id === questId
          ? {
              ...q,
              completed: true,
              completedAt: new Date().toISOString(),
              streak: q.questType === 'daily' ? (q.streak || 0) + 1 : q.streak,
              bossHp: q.questType === 'boss' ? 0 : q.bossHp
            }
          : q
      )
    );

    // 2. Instant Optimistic Hero State Update (XP, Gold, and Stats increase immediately!)
    let statBonusText = null;
    if (hero) {
      const categoryMap = { Coding: 'intellect', Gym: 'strength', Study: 'discipline', Art: 'creativity' };
      const attr = categoryMap[targetQuest.category] || targetQuest.attribute || 'strength';
      const statBonus = targetQuest.difficulty === 'epic' ? 4 : targetQuest.difficulty === 'hard' ? 2.5 : 1.5;

      const statAbbrMap = { intellect: 'INT', strength: 'STR', discipline: 'DISC', creativity: 'CREAT' };
      statBonusText = `+${statBonus} ${statAbbrMap[attr] || attr.toUpperCase()}`;

      const optimisticStats = { ...(hero.stats || { strength: 10, intellect: 10, discipline: 10, creativity: 10 }) };
      optimisticStats[attr] = Number(((optimisticStats[attr] || 10) + statBonus).toFixed(1));

      updateHero({
        xp: (hero.xp || 0) + targetQuest.xpReward,
        gold: (hero.gold || 0) + targetQuest.goldReward,
        stats: optimisticStats,
        streak: (hero.streak || 0) + 1
      });
    }

    // Trigger visual particles & audio chime instantly
    triggerFloatingReward(targetQuest.xpReward, targetQuest.goldReward, coordinates, statBonusText);
    playQuestComplete();

    try {
      const res = await api.post(`/quests/${questId}/complete`);
      if (res.data.success) {
        // Sync with confirmed database record
        const confirmedHero = res.data.user || res.data.hero;
        if (confirmedHero) {
          updateHero(confirmedHero);
        }

        if (res.data.levelUpData && res.data.levelUpData.leveledUp) {
          playLevelUp();
          setLevelUpData(res.data.levelUpData);
        }
      }
    } catch (err) {
      console.error('Failed to complete quest:', err);
      // Rollback optimistic updates if server returns an error
      setQuests(previousQuests);
      if (previousHero) updateHero(previousHero);
    }
  };

  /**
   * Edit / Amend a quest (CRUD: Update)
   */
  const updateQuest = async (questId, updatedFields) => {
    const previousQuests = [...quests];

    // Optimistically update
    setQuests((prev) =>
      prev.map((q) => (q._id === questId ? { ...q, ...updatedFields } : q))
    );

    try {
      const res = await api.patch(`/quests/${questId}`, updatedFields);
      if (res.data.success) {
        const savedQuest = res.data.quest || res.data.task;
        setQuests((prev) =>
          prev.map((q) => (q._id === questId ? savedQuest : q))
        );
        return { success: true, quest: savedQuest };
      }
    } catch (err) {
      console.error('Failed to update quest:', err);
      setQuests(previousQuests);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  /**
   * Reopen / Undo quest
   */
  const undoQuest = async (questId) => {
    try {
      const res = await api.post(`/quests/${questId}/undo`);
      if (res.data.success) {
        const updated = res.data.quest || res.data.task;
        setQuests((prev) =>
          prev.map((q) => (q._id === questId ? updated : q))
        );
        const updatedHero = res.data.user || res.data.hero;
        if (updatedHero) updateHero(updatedHero);
      }
    } catch (err) {
      console.error('Failed to undo quest:', err);
    }
  };

  /**
   * Create quest (CRUD: Create)
   */
  const createQuest = async (questData) => {
    try {
      const res = await api.post('/quests', questData);
      if (res.data.success) {
        const newQuest = res.data.quest || res.data.task;
        setQuests((prev) => [newQuest, ...prev]);
        return { success: true, quest: newQuest };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to forge quest.';
      return { success: false, message: msg };
    }
  };

  /**
   * Delete quest (CRUD: Delete)
   */
  const deleteQuest = async (questId) => {
    const previousQuests = [...quests];
    setQuests((prev) => prev.filter((q) => q._id !== questId));

    try {
      const res = await api.delete(`/quests/${questId}`);
      if (res.data.success) {
        return { success: true };
      }
    } catch (err) {
      setQuests(previousQuests);
      return { success: false, message: err.message };
    }
  };

  /**
   * Boss Raid milestone damage strike
   */
  const toggleBossSubtask = async (questId, subtaskId) => {
    try {
      playBossHit();
      const res = await api.patch(`/quests/${questId}/subtasks/${subtaskId}`);
      if (res.data.success) {
        const updated = res.data.quest || res.data.task;
        setQuests((prev) =>
          prev.map((q) => (q._id === questId ? updated : q))
        );
        const updatedHero = res.data.user || res.data.hero;
        if (updatedHero) updateHero(updatedHero);

        if (res.data.levelUpData && res.data.levelUpData.leveledUp) {
          playLevelUp();
          setLevelUpData(res.data.levelUpData);
        }
      }
    } catch (err) {
      console.error('Failed to damage boss:', err);
    }
  };

  return (
    <QuestContext.Provider
      value={{
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
        setSearchQuery,
        fetchQuests,
        createQuest,
        updateQuest,
        deleteQuest,
        completeQuest,
        undoQuest,
        toggleBossSubtask,
        floatingRewards,
        levelUpData,
        setLevelUpData
      }}
    >
      {children}
    </QuestContext.Provider>
  );
};

export const useQuests = () => {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
};
