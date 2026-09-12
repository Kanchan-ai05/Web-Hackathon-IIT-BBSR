/**
 * Life RPG Progression Engine
 * Implements non-linear leveling: XP Required = 100 * Level^1.5
 * Stat Growth via Categories:
 * - Coding -> Intellect
 * - Gym    -> Strength
 * - Study  -> Discipline
 * - Art    -> Creativity
 * Streak & Longest Streak Engine
 */

// Exact Non-Linear Formula: XP Required = 100 * Level^1.5
const getXpRequiredForLevel = (level) => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Category to Stat Mapping
const CATEGORY_STAT_MAP = {
  Coding: 'intellect',
  Gym: 'strength',
  Study: 'discipline',
  Art: 'creativity',
  // Common aliases
  Programming: 'intellect',
  Development: 'intellect',
  Fitness: 'strength',
  Workout: 'strength',
  Reading: 'discipline',
  Knowledge: 'discipline',
  Habits: 'discipline',
  Design: 'creativity',
  Music: 'creativity',
  Writing: 'creativity'
};

// Base rewards and stat gains mapped to difficulty tiers
const DIFFICULTY_REWARDS = {
  trivial: { xp: 15, gold: 10, statBonus: 0.5 },
  easy: { xp: 35, gold: 20, statBonus: 1.0 },
  medium: { xp: 75, gold: 45, statBonus: 1.5 },
  hard: { xp: 150, gold: 90, statBonus: 2.5 },
  epic: { xp: 300, gold: 200, statBonus: 4.0 }
};

// Class Archetypes with initial stats
const CLASS_PROFILES = {
  Warrior: {
    primaryStat: 'strength',
    bonusText: '+15% XP on Gym & Strength challenges',
    initialStats: { strength: 14, intellect: 9, discipline: 11, creativity: 8 }
  },
  Mage: {
    primaryStat: 'intellect',
    bonusText: '+15% XP on Coding & Intellect challenges',
    initialStats: { strength: 7, intellect: 15, discipline: 12, creativity: 10 }
  },
  Rogue: {
    primaryStat: 'creativity',
    bonusText: '+15% XP on Art, Design & Creativity challenges',
    initialStats: { strength: 9, intellect: 11, discipline: 10, creativity: 14 }
  },
  Paladin: {
    primaryStat: 'discipline',
    bonusText: '+15% XP on Study & Discipline habits',
    initialStats: { strength: 11, intellect: 10, discipline: 15, creativity: 8 }
  }
};

const LEVEL_TITLES = {
  1: 'Novice Adventurer',
  3: 'Guild Initiate',
  5: 'Bounty Hunter',
  7: 'Dungeon Crawler',
  10: 'Guild Champion',
  15: 'Hero of the Realm',
  20: 'Dragon Slayer',
  25: 'Grand Master',
  30: 'Immortal Legend'
};

/**
 * Resolve target stat attribute from quest category or attribute string
 */
const resolveStatFromCategory = (category, fallbackAttribute = 'strength') => {
  if (category && CATEGORY_STAT_MAP[category]) {
    return CATEGORY_STAT_MAP[category];
  }
  // Check lowercase match
  for (const [key, val] of Object.entries(CATEGORY_STAT_MAP)) {
    if (category && category.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  if (['strength', 'intellect', 'discipline', 'creativity'].includes(fallbackAttribute)) {
    return fallbackAttribute;
  }
  return 'strength';
};

/**
 * Calculate rewards with class synergy
 */
const calculateQuestRewards = (difficulty = 'medium', category = 'Gym', heroClass = 'Warrior') => {
  const base = DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.medium;
  const profile = CLASS_PROFILES[heroClass] || CLASS_PROFILES.Warrior;
  const stat = resolveStatFromCategory(category);

  let xp = base.xp;
  let gold = base.gold;

  // Class synergy: +15% XP if quest stat matches hero primary stat
  if (profile.primaryStat === stat) {
    xp = Math.round(xp * 1.15);
  }

  return {
    xpReward: xp,
    goldReward: gold,
    statBonus: base.statBonus,
    stat
  };
};

/**
 * Process Quest Completion:
 * - Calculates Category -> Stat Growth (Coding -> Intellect, Gym -> Strength, Study -> Discipline, Art -> Creativity)
 * - Updates XP and Gold
 * - Evaluates non-linear Level-Up (100 * Level^1.5)
 * - Updates daily streak and longestStreak
 */
const processXpGain = (
  user,
  addedXp,
  addedGold = 0,
  category = 'Gym',
  statBonus = 1.0,
  isDaily = false
) => {
  let level = user.level || 1;
  let xp = (user.xp !== undefined ? user.xp : user.currentXp) || 0;
  let maxXp = user.maxXp || getXpRequiredForLevel(level);
  let gold = (user.gold || 0) + addedGold;

  // 4 Core RPG Stats
  const stats = {
    strength: user.stats?.strength || 10,
    intellect: user.stats?.intellect || 10,
    discipline: user.stats?.discipline || 10,
    creativity: user.stats?.creativity || 10
  };

  // Immediate stat increase based on Category!
  const targetStat = resolveStatFromCategory(category);
  if (stats[targetStat] !== undefined) {
    stats[targetStat] = Number((stats[targetStat] + statBonus).toFixed(1));
  }

  // Daily Streak & Longest Streak Engine
  let streak = user.streak || 0;
  let longestStreak = user.longestStreak || 0;

  if (isDaily) {
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = user.lastDailyCompletedDate
      ? new Date(user.lastDailyCompletedDate).setHours(0, 0, 0, 0)
      : null;
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (!lastActive) {
      streak = 1;
    } else if (today - lastActive === oneDayMs) {
      streak += 1;
    } else if (today - lastActive > oneDayMs) {
      streak = 1;
    } else if (today === lastActive) {
      streak = Math.max(1, streak);
    }

    if (streak > longestStreak) {
      longestStreak = streak;
    }
  }

  xp += addedXp;

  let leveledUp = false;
  let levelsGained = 0;
  const newlyUnlockedTitles = [];
  let totalBonusGold = 0;
  const titles = Array.isArray(user.titles) ? [...user.titles] : ['Novice Adventurer'];

  // Non-linear level-up loop: XP Required = Math.floor(100 * Math.pow(level, 1.5))
  while (xp >= maxXp) {
    xp -= maxXp;
    level += 1;
    levelsGained += 1;
    leveledUp = true;
    maxXp = getXpRequiredForLevel(level);

    // Level-up gold stipend
    const bonus = level * 25;
    gold += bonus;
    totalBonusGold += bonus;

    // Level-up boosts all 4 stats by +1, plus extra point to primary stat
    stats.strength = Math.round(stats.strength + 1);
    stats.intellect = Math.round(stats.intellect + 1);
    stats.discipline = Math.round(stats.discipline + 1);
    stats.creativity = Math.round(stats.creativity + 1);

    const profile = CLASS_PROFILES[user.heroClass];
    if (profile?.primaryStat && stats[profile.primaryStat] !== undefined) {
      stats[profile.primaryStat] += 1;
    }

    if (LEVEL_TITLES[level] && !titles.includes(LEVEL_TITLES[level])) {
      titles.push(LEVEL_TITLES[level]);
      newlyUnlockedTitles.push(LEVEL_TITLES[level]);
    }
  }

  return {
    leveledUp,
    levelsGained,
    newLevel: level,
    xp,
    currentXp: xp,
    maxXp,
    gold,
    stats,
    streak,
    longestStreak,
    targetStat,
    statBonus,
    titles,
    totalBonusGold,
    newlyUnlockedTitles
  };
};

module.exports = {
  getXpRequiredForLevel,
  getMaxXpForLevel: getXpRequiredForLevel,
  CATEGORY_STAT_MAP,
  DIFFICULTY_REWARDS,
  CLASS_PROFILES,
  LEVEL_TITLES,
  resolveStatFromCategory,
  calculateQuestRewards,
  processXpGain
};
