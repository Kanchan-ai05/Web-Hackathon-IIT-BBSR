/**
 * Local Realm Engine (Offline & Static Cloud Fallback)
 * 
 * Provides zero-downtime, in-browser persistence for the public Netlify deployment
 * when the remote cloud server is asleep or connecting.
 * Automatically synchronizes with localStorage and executes authentic RPG progression logic.
 */

const STORAGE_KEYS = {
  USERS: 'liferpg_local_users',
  HERO: 'liferpg_local_hero',
  QUESTS: 'liferpg_local_quests',
  INVENTORY: 'liferpg_local_inventory',
  TOKEN: 'liferpg_token'
};

const DEFAULT_SHOP_ITEMS = [
  {
    _id: 'item_golden_sword_1',
    name: 'Golden Sword',
    description: 'Forged in dragonfire. Grants +5 Strength to your hero loadout.',
    cost: 150,
    icon: 'Sword',
    category: 'gear',
    gearSlot: 'weapon',
    statBonus: { stat: 'strength', amount: 5 },
    isUnique: true
  },
  {
    _id: 'item_wizard_hat_2',
    name: 'Wizard Hat',
    description: 'Woven with celestial silk. Grants +5 Intellect to your arcane sheet.',
    cost: 180,
    icon: 'Shield',
    category: 'gear',
    gearSlot: 'hat',
    statBonus: { stat: 'intellect', amount: 5 },
    isUnique: true
  },
  {
    _id: 'item_crystal_pet_3',
    name: 'Crystal Pet',
    description: 'A luminous elemental companion granting +5 Creativity.',
    cost: 250,
    icon: 'Cat',
    category: 'pet',
    gearSlot: 'pet',
    statBonus: { stat: 'creativity', amount: 5 },
    isUnique: true
  },
  {
    _id: 'item_castle_theme_4',
    name: 'Castle Theme',
    description: 'Enchants your Guild Hall with stone fortress ramparts and royal gold borders.',
    cost: 200,
    icon: 'Award',
    category: 'theme',
    themeId: 'castle-theme',
    isUnique: true
  },
  {
    _id: 'item_night_theme_5',
    name: 'Night Theme',
    description: 'Bathes your Guild Hall in midnight cosmic indigo and starlight glows.',
    cost: 200,
    icon: 'Moon',
    category: 'theme',
    themeId: 'night-theme',
    isUnique: true
  },
  {
    _id: 'item_achievement_badges_6',
    name: 'Achievement Badges',
    description: 'Bestows +5 Discipline and the legendary "Grandmaster Achiever" title.',
    cost: 120,
    icon: 'Award',
    category: 'badge',
    gearSlot: 'badge',
    statBonus: { stat: 'discipline', amount: 5 },
    isUnique: true
  },
  {
    _id: 'item_vitality_elixir_7',
    name: 'Elixir of Vitality',
    description: 'Restores focus and awards +50 instant XP.',
    cost: 45,
    icon: 'FlaskConical',
    category: 'potion'
  }
];

const DEFAULT_DEMO_HERO = {
  _id: 'hero_sir_arthur_demo',
  username: 'Sir Arthur',
  email: 'arthur@realm.com',
  heroClass: 'Warrior',
  title: 'Novice Adventurer',
  level: 2,
  xp: 90,
  maxXp: 282,
  gold: 170,
  streak: 3,
  longestStreak: 5,
  lastCompletedDate: new Date().toISOString(),
  equippedTheme: 'dark-fantasy',
  equippedGear: {
    weapon: null,
    hat: null,
    pet: null,
    badge: null
  },
  stats: {
    strength: 14,
    intellect: 13,
    discipline: 11,
    creativity: 11
  }
};

const DEFAULT_QUESTS = [
  {
    _id: 'quest_1',
    user: 'hero_sir_arthur_demo',
    title: 'Morning Heavy Gym Workout',
    description: 'Bench press, deadlifts, and 20 min interval sprint.',
    category: 'Gym',
    difficulty: 'hard',
    questType: 'daily',
    xpReward: 150,
    goldReward: 90,
    completed: false,
    streak: 3,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'quest_2',
    user: 'hero_sir_arthur_demo',
    title: 'Production System Architecture',
    description: 'Implement chunk splitting, dynamic CORS, and production APIs.',
    category: 'Coding',
    difficulty: 'epic',
    questType: 'todo',
    xpReward: 300,
    goldReward: 200,
    completed: false,
    streak: 0,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'quest_3',
    user: 'hero_sir_arthur_demo',
    title: '30-Minute Deep Reading Session',
    description: 'Read Chapter 4 of Distributed Systems text.',
    category: 'Study',
    difficulty: 'medium',
    questType: 'daily',
    xpReward: 75,
    goldReward: 45,
    completed: false,
    streak: 2,
    createdAt: new Date().toISOString()
  },
  {
    _id: 'quest_4',
    user: 'hero_sir_arthur_demo',
    title: 'Dungeon Colossus: Procrastination Titan',
    description: 'Break through mental resistance by conquering tactical strikes!',
    category: 'Gym',
    difficulty: 'epic',
    questType: 'boss',
    bossName: 'Procrastination Titan',
    bossHp: 60,
    bossMaxHp: 100,
    xpReward: 350,
    goldReward: 250,
    completed: false,
    subTasks: [
      { _id: 'sub_1', title: 'Clear workspace desk', completed: true },
      { _id: 'sub_2', title: 'Outline 3 primary objectives', completed: true },
      { _id: 'sub_3', title: 'Execute first 25-minute sprint', completed: false }
    ],
    createdAt: new Date().toISOString()
  }
];

class LocalRealmEngine {
  constructor() {
    this.init();
  }

  getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      return globalThis.localStorage;
    }
    if (!this._memoryStorage) {
      this._memoryStorage = {};
    }
    return {
      getItem: (k) => (k in this._memoryStorage ? this._memoryStorage[k] : null),
      setItem: (k, v) => { this._memoryStorage[k] = String(v); },
      removeItem: (k) => { delete this._memoryStorage[k]; }
    };
  }

  init() {
    const storage = this.getStorage();
    if (!storage.getItem(STORAGE_KEYS.HERO)) {
      storage.setItem(STORAGE_KEYS.HERO, JSON.stringify(DEFAULT_DEMO_HERO));
    }
    if (!storage.getItem(STORAGE_KEYS.QUESTS)) {
      storage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(DEFAULT_QUESTS));
    }
    if (!storage.getItem(STORAGE_KEYS.INVENTORY)) {
      storage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify([]));
    }
    if (!storage.getItem(STORAGE_KEYS.USERS)) {
      storage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_DEMO_HERO]));
    }
  }

  getHero() {
    try {
      const data = this.getStorage().getItem(STORAGE_KEYS.HERO);
      return data ? JSON.parse(data) : DEFAULT_DEMO_HERO;
    } catch {
      return DEFAULT_DEMO_HERO;
    }
  }

  saveHero(hero) {
    this.getStorage().setItem(STORAGE_KEYS.HERO, JSON.stringify(hero));
    const users = this.getUsers();
    const idx = users.findIndex((u) => u._id === hero._id || u.email === hero.email);
    if (idx >= 0) {
      users[idx] = hero;
    } else {
      users.push(hero);
    }
    this.getStorage().setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getUsers() {
    try {
      const data = this.getStorage().getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [DEFAULT_DEMO_HERO];
    } catch {
      return [DEFAULT_DEMO_HERO];
    }
  }

  getQuests() {
    try {
      const data = this.getStorage().getItem(STORAGE_KEYS.QUESTS);
      return data ? JSON.parse(data) : DEFAULT_QUESTS;
    } catch {
      return DEFAULT_QUESTS;
    }
  }

  saveQuests(quests) {
    this.getStorage().setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  }

  getInventory() {
    try {
      const data = this.getStorage().getItem(STORAGE_KEYS.INVENTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveInventory(inv) {
    this.getStorage().setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
  }

  calculateXpForLevel(lvl) {
    return Math.floor(100 * Math.pow(lvl, 1.5));
  }

  async handleRequest(config) {
    const url = config.url.replace(/^\/api/, '');
    const method = (config.method || 'GET').toUpperCase();
    let body = {};
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
    } catch {
      body = config.data || {};
    }

    // --- HEALTH ---
    if (url === '/health') {
      return {
        data: {
          status: 'online',
          realm: 'Guild Quest Cloud Edge Realm',
          mongoConnection: 'connected',
          timestamp: new Date().toISOString()
        }
      };
    }

    // --- AUTH ---
    if (url === '/auth/login' && method === 'POST') {
      const users = this.getUsers();
      const hero = users.find((u) => u.email === body.email) || this.getHero();
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'guild_token_' + hero._id);
      this.saveHero(hero);
      return {
        data: {
          success: true,
          token: 'guild_token_' + hero._id,
          user: hero
        }
      };
    }

    if (url === '/auth/register' && method === 'POST') {
      const newHero = {
        _id: 'hero_' + Date.now(),
        username: body.username || 'Adventurer',
        email: body.email,
        heroClass: body.heroClass || 'Warrior',
        title: 'Novice Adventurer',
        level: 1,
        xp: 0,
        maxXp: 100,
        gold: 50,
        streak: 0,
        longestStreak: 0,
        equippedTheme: 'dark-fantasy',
        equippedGear: { weapon: null, hat: null, pet: null, badge: null },
        stats: { strength: 10, intellect: 10, discipline: 10, creativity: 10 }
      };
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'guild_token_' + newHero._id);
      this.saveHero(newHero);
      return {
        data: {
          success: true,
          token: 'guild_token_' + newHero._id,
          user: newHero
        }
      };
    }

    if (url === '/auth/me' && method === 'GET') {
      const hero = this.getHero();
      return {
        data: {
          success: true,
          user: hero,
          hero
        }
      };
    }

    if (url === '/auth/profile' && method === 'PATCH') {
      const hero = this.getHero();
      if (body.title) hero.title = body.title;
      if (body.equippedTheme) hero.equippedTheme = body.equippedTheme;
      this.saveHero(hero);
      return {
        data: {
          success: true,
          user: hero,
          hero
        }
      };
    }

    // --- QUESTS ---
    if (url === '/quests' && method === 'GET') {
      let quests = this.getQuests();
      const params = config.params || {};
      if (params.type && params.type !== 'all') quests = quests.filter((q) => q.questType === params.type);
      if (params.completed === 'true') quests = quests.filter((q) => q.completed);
      if (params.completed === 'false') quests = quests.filter((q) => !q.completed);
      if (params.category && params.category !== 'all') quests = quests.filter((q) => q.category === params.category);
      if (params.difficulty && params.difficulty !== 'all') quests = quests.filter((q) => q.difficulty === params.difficulty);
      if (params.search) {
        const s = params.search.toLowerCase();
        quests = quests.filter((q) => q.title.toLowerCase().includes(s) || (q.description && q.description.toLowerCase().includes(s)));
      }
      return {
        data: {
          success: true,
          quests,
          tasks: quests,
          count: quests.length
        }
      };
    }

    if (url === '/quests' && method === 'POST') {
      const quests = this.getQuests();
      const hero = this.getHero();
      const baseRewards = {
        trivial: { xp: 15, gold: 10 },
        easy: { xp: 35, gold: 20 },
        medium: { xp: 75, gold: 45 },
        hard: { xp: 150, gold: 90 },
        epic: { xp: 300, gold: 200 }
      };
      const diff = body.difficulty || 'medium';
      const reward = baseRewards[diff] || baseRewards.medium;

      const newQuest = {
        _id: 'quest_' + Date.now(),
        user: hero._id,
        title: body.title,
        description: body.description || '',
        category: body.category || 'Gym',
        difficulty: diff,
        questType: body.questType || 'todo',
        xpReward: reward.xp,
        goldReward: reward.gold,
        completed: false,
        streak: 0,
        subTasks: body.questType === 'boss' ? (body.subTasks || []).map((t, idx) => ({ _id: `sub_${idx}_` + Date.now(), title: t, completed: false })) : [],
        bossName: body.bossName || (body.questType === 'boss' ? 'Dungeon Colossus' : undefined),
        bossHp: body.questType === 'boss' ? 100 : undefined,
        bossMaxHp: body.questType === 'boss' ? 100 : undefined,
        createdAt: new Date().toISOString()
      };
      quests.unshift(newQuest);
      this.saveQuests(quests);
      return {
        data: {
          success: true,
          quest: newQuest,
          task: newQuest
        }
      };
    }

    // Complete quest
    const completeMatch = url.match(/^\/quests\/([^/]+)\/complete$/);
    if (completeMatch && method === 'POST') {
      const questId = completeMatch[1];
      const quests = this.getQuests();
      const quest = quests.find((q) => q._id === questId);
      const hero = this.getHero();

      if (quest && !quest.completed) {
        quest.completed = true;
        quest.completedAt = new Date().toISOString();
        if (quest.questType === 'daily') quest.streak = (quest.streak || 0) + 1;
        if (quest.questType === 'boss') quest.bossHp = 0;
        this.saveQuests(quests);

        // Calculate stat bonus
        const categoryMap = { Coding: 'intellect', Gym: 'strength', Study: 'discipline', Art: 'creativity' };
        const attr = categoryMap[quest.category] || 'strength';
        const statInc = quest.difficulty === 'epic' ? 4 : quest.difficulty === 'hard' ? 2.5 : 1.5;
        hero.stats[attr] = Number(((hero.stats[attr] || 10) + statInc).toFixed(1));

        // Streaks
        hero.streak = (hero.streak || 0) + 1;
        if (hero.streak > (hero.longestStreak || 0)) {
          hero.longestStreak = hero.streak;
        }

        // XP & Gold
        hero.gold = (hero.gold || 0) + quest.goldReward;
        hero.xp = (hero.xp || 0) + quest.xpReward;

        let leveledUp = false;
        let oldLevel = hero.level;
        let requiredXp = this.calculateXpForLevel(hero.level);

        while (hero.xp >= requiredXp) {
          hero.xp -= requiredXp;
          hero.level += 1;
          leveledUp = true;
          hero.gold += hero.level * 25; // level bounty
          hero.stats.strength += 1;
          hero.stats.intellect += 1;
          hero.stats.discipline += 1;
          hero.stats.creativity += 1;
          requiredXp = this.calculateXpForLevel(hero.level);
        }
        hero.maxXp = requiredXp;
        this.saveHero(hero);

        const levelUpData = leveledUp
          ? {
              leveledUp: true,
              oldLevel,
              newLevel: hero.level,
              xp: hero.xp,
              maxXp: hero.maxXp,
              gold: hero.gold,
              bonusGold: hero.level * 25,
              stats: hero.stats
            }
          : { leveledUp: false };

        return {
          data: {
            success: true,
            user: hero,
            hero,
            levelUpData
          }
        };
      }
    }

    // Delete quest
    const deleteMatch = url.match(/^\/quests\/([^/]+)$/);
    if (deleteMatch && method === 'DELETE') {
      const questId = deleteMatch[1];
      let quests = this.getQuests();
      quests = quests.filter((q) => q._id !== questId);
      this.saveQuests(quests);
      return { data: { success: true } };
    }

    // Patch quest
    if (deleteMatch && method === 'PATCH') {
      const questId = deleteMatch[1];
      const quests = this.getQuests();
      const quest = quests.find((q) => q._id === questId);
      if (quest) {
        Object.assign(quest, body);
        this.saveQuests(quests);
        return { data: { success: true, quest } };
      }
    }

    // Toggle Boss Subtask
    const subtaskMatch = url.match(/^\/quests\/([^/]+)\/subtasks\/([^/]+)$/);
    if (subtaskMatch && method === 'PATCH') {
      const [, questId, subtaskId] = subtaskMatch;
      const quests = this.getQuests();
      const quest = quests.find((q) => q._id === questId);
      if (quest && quest.subTasks) {
        const sub = quest.subTasks.find((s) => s._id === subtaskId);
        if (sub) {
          sub.completed = !sub.completed;
          const completedCount = quest.subTasks.filter((s) => s.completed).length;
          const damagePer = Math.round(100 / quest.subTasks.length);
          quest.bossHp = Math.max(0, 100 - completedCount * damagePer);
          if (completedCount === quest.subTasks.length) {
            quest.completed = true;
          }
          this.saveQuests(quests);
          return { data: { success: true, quest } };
        }
      }
    }

    // --- SHOP & ECONOMY ---
    if (url === '/shop/items' && method === 'GET') {
      return {
        data: {
          success: true,
          items: DEFAULT_SHOP_ITEMS
        }
      };
    }

    if (url === '/shop/purchase' && method === 'POST') {
      const hero = this.getHero();
      const item = DEFAULT_SHOP_ITEMS.find((i) => i._id === body.itemId);
      if (!item) {
        throw { response: { status: 404, data: { success: false, message: 'Item not found in catalog.' } } };
      }
      if ((hero.gold || 0) < item.cost) {
        throw { response: { status: 400, data: { success: false, message: 'Insufficient gold balance.' } } };
      }

      hero.gold -= item.cost;
      const inventory = this.getInventory();

      const newInvItem = {
        _id: 'inv_' + Date.now(),
        item: item._id,
        name: item.name,
        description: item.description,
        cost: item.cost,
        icon: item.icon,
        category: item.category,
        statBonus: item.statBonus,
        themeId: item.themeId,
        gearSlot: item.gearSlot,
        equipped: true,
        purchasedAt: new Date().toISOString()
      };

      // Auto equip
      if (item.themeId) {
        hero.equippedTheme = item.themeId;
      }
      if (item.gearSlot) {
        hero.equippedGear = hero.equippedGear || {};
        hero.equippedGear[item.gearSlot] = item.name;
        if (item.statBonus) {
          hero.stats[item.statBonus.stat] = (hero.stats[item.statBonus.stat] || 10) + item.statBonus.amount;
        }
      }

      inventory.push(newInvItem);
      this.saveInventory(inventory);
      this.saveHero(hero);

      return {
        data: {
          success: true,
          message: `Successfully acquired ${item.name}!`,
          user: hero,
          hero,
          inventoryItem: newInvItem
        }
      };
    }

    if (url === '/shop/inventory' && method === 'GET') {
      const inventory = this.getInventory();
      return {
        data: {
          success: true,
          inventory
        }
      };
    }

    if (url.match(/^\/shop\/inventory\/([^/]+)\/equip$/) && method === 'POST') {
      const invId = url.match(/^\/shop\/inventory\/([^/]+)\/equip$/)[1];
      const inventory = this.getInventory();
      const hero = this.getHero();
      const target = inventory.find((i) => i._id === invId);

      if (target) {
        target.equipped = !target.equipped;
        if (target.themeId && target.equipped) {
          hero.equippedTheme = target.themeId;
        }
        if (target.gearSlot) {
          hero.equippedGear = hero.equippedGear || {};
          hero.equippedGear[target.gearSlot] = target.equipped ? target.name : null;
        }
        this.saveInventory(inventory);
        this.saveHero(hero);

        return {
          data: {
            success: true,
            user: hero,
            hero,
            inventoryItem: target
          }
        };
      }
    }

    // --- STATS ---
    if (url === '/stats/overview' && method === 'GET') {
      const quests = this.getQuests();
      const hero = this.getHero();
      return {
        data: {
          success: true,
          stats: {
            totalCompleted: quests.filter((q) => q.completed).length,
            activeQuests: quests.filter((q) => !q.completed).length,
            currentStreak: hero.streak || 0,
            longestStreak: hero.longestStreak || 0
          }
        }
      };
    }

    if (url === '/stats/leaderboard' && method === 'GET') {
      const hero = this.getHero();
      const leaderboard = [
        { _id: hero._id, username: hero.username, level: hero.level, gold: hero.gold, heroClass: hero.heroClass, streak: hero.streak },
        { _id: 'hero_valkyrie', username: 'Valkyrie Queen', level: 12, gold: 1450, heroClass: 'Paladin', streak: 14 },
        { _id: 'hero_shadow', username: 'Shadow Blade', level: 9, gold: 980, heroClass: 'Rogue', streak: 8 },
        { _id: 'hero_archmage', username: 'Archmage Zephyr', level: 7, gold: 640, heroClass: 'Mage', streak: 5 }
      ];
      leaderboard.sort((a, b) => b.level - a.level || b.gold - a.gold);

      return {
        data: {
          success: true,
          leaderboard
        }
      };
    }

    // Default fallback
    return { data: { success: true } };
  }
}

export const localRealmEngine = new LocalRealmEngine();
