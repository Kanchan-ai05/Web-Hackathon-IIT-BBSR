const Task = require('../models/Task');
const User = require('../models/User');
const {
  calculateQuestRewards,
  processXpGain,
  resolveStatFromCategory,
  DIFFICULTY_REWARDS
} = require('../utils/rpgEngine');

/**
 * Get all quests for authenticated user with optional filters
 */
const getQuests = async (req, res, next) => {
  try {
    const { type, completed, difficulty, category, search } = req.query;
    const filter = { user: req.user._id };

    if (type && type !== 'all') {
      filter.questType = type;
    }

    if (completed !== undefined && completed !== 'all') {
      filter.completed = completed === 'true';
    }

    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const today = new Date().setHours(0, 0, 0, 0);
    const tasks = await Task.find(filter).sort({ completed: 1, createdAt: -1 });

    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.questType === 'daily' && task.completed && task.completedAt) {
          const compDate = new Date(task.completedAt).setHours(0, 0, 0, 0);
          if (compDate < today) {
            task.completed = false;
            await task.save();
          }
        }
        return task;
      })
    );

    res.status(200).json({
      success: true,
      count: updatedTasks.length,
      quests: updatedTasks,
      tasks: updatedTasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single quest by ID
 */
const getQuestById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Quest not found.' });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to access another hero\'s quest.'
      });
    }
    res.status(200).json({ success: true, quest: task, task });
  } catch (error) {
    next(error);
  }
};

/**
 * Forge a new quest
 */
const createQuest = async (req, res, next) => {
  try {
    const {
      title,
      category = 'Gym',
      difficulty = 'medium',
      attribute,
      questType = 'todo',
      description = '',
      bossName,
      subTasks = [],
      dueDate
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Quest title is required and cannot be blank.'
      });
    }

    // Auto-resolve attribute from category if not provided
    const targetAttribute = attribute || resolveStatFromCategory(category);
    const rewards = calculateQuestRewards(difficulty, category, req.user.heroClass);

    let parsedSubTasks = [];
    if (questType === 'boss') {
      parsedSubTasks = Array.isArray(subTasks)
        ? subTasks.map((t) => (typeof t === 'string' ? { title: t, completed: false } : t))
        : [];
      if (parsedSubTasks.length === 0) {
        parsedSubTasks = [
          { title: 'Formulate battle tactic', completed: false },
          { title: 'Strike initial blow', completed: false },
          { title: 'Deliver crushing finisher', completed: false }
        ];
      }
    }

    const task = await Task.create({
      user: req.user._id,
      title: title.trim(),
      category: category.trim(),
      difficulty,
      attribute: targetAttribute,
      questType,
      description: description.trim(),
      xpReward: rewards.xpReward,
      goldReward: rewards.goldReward,
      bossName: bossName || (questType === 'boss' ? 'Dungeon Colossus' : undefined),
      bossHp: 100,
      bossMaxHp: 100,
      subTasks: parsedSubTasks,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date(),
      completedAt: null
    });

    res.status(201).json({
      success: true,
      message: `Quest "${task.title}" inscribed in your log!`,
      quest: task,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Edit / Update an existing quest
 */
const updateQuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      difficulty,
      attribute,
      description,
      questType,
      dueDate
    } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found.'
      });
    }
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to modify another hero\'s quest.'
      });
    }

    if (title !== undefined) {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Quest title cannot be empty.'
        });
      }
      task.title = title.trim();
    }
    if (category) {
      task.category = category.trim();
      task.attribute = resolveStatFromCategory(category.trim(), task.attribute);
    }
    if (description !== undefined) task.description = description.trim();
    if (questType) task.questType = questType;
    if (dueDate !== undefined) task.dueDate = dueDate;

    let recalc = false;
    if (difficulty && difficulty !== task.difficulty) {
      task.difficulty = difficulty;
      recalc = true;
    }
    if (attribute && attribute !== task.attribute) {
      task.attribute = attribute;
      recalc = true;
    }

    if (recalc || category) {
      const rewards = calculateQuestRewards(task.difficulty, task.category, req.user.heroClass);
      task.xpReward = rewards.xpReward;
      task.goldReward = rewards.goldReward;
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: `Quest "${task.title}" amended successfully!`,
      quest: task,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete a quest:
 * - Increases matching stat: Coding->Intellect, Gym->Strength, Study->Discipline, Art->Creativity
 * - Increases XP & Gold
 * - Non-linear leveling formula evaluation (100 * level^1.5)
 * - Updates streak & longestStreak
 * - Database updates immediately
 */
const completeQuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found in your log.'
      });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to complete another hero\'s quest.'
      });
    }

    if (task.completed) {
      return res.status(400).json({
        success: false,
        message: 'This quest is already conquered!'
      });
    }

    // 1. Mark task completed in DB
    task.completed = true;
    task.completedAt = new Date();
    task.completedDates.push(new Date());

    if (task.questType === 'daily') {
      task.streak = (task.streak || 0) + 1;
    }
    if (task.questType === 'boss') {
      task.bossHp = 0;
      task.subTasks.forEach((st) => (st.completed = true));
    }
    await task.save();

    // 2. Fetch User and process RPG Progression
    const user = await User.findById(req.user._id);

    const difficultyConfig = DIFFICULTY_REWARDS[task.difficulty] || DIFFICULTY_REWARDS.medium;
    const statBonus = difficultyConfig.statBonus || 1.0;

    const levelResult = processXpGain(
      user,
      task.xpReward,
      task.goldReward,
      task.category,
      statBonus,
      true
    );

    user.lastDailyCompletedDate = new Date();

    // Commit User updates immediately to MongoDB
    user.level = levelResult.newLevel;
    user.xp = levelResult.xp;
    user.maxXp = levelResult.maxXp;
    user.gold = levelResult.gold;
    user.stats = levelResult.stats;
    user.streak = levelResult.streak;
    user.longestStreak = levelResult.longestStreak;
    user.titles = levelResult.titles;

    await user.save();

    res.status(200).json({
      success: true,
      message: `Quest "${task.title}" conquered! +${task.xpReward} XP, +${task.goldReward} Gold, +${statBonus} ${levelResult.targetStat.toUpperCase()}!`,
      quest: task,
      task,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON(),
      xpGained: task.xpReward,
      goldGained: task.goldReward,
      statGained: { attribute: levelResult.targetStat, bonus: statBonus },
      levelUpData: {
        leveledUp: levelResult.leveledUp,
        levelsGained: levelResult.levelsGained,
        newLevel: levelResult.newLevel,
        bonusGold: levelResult.totalBonusGold,
        newlyUnlockedTitles: levelResult.newlyUnlockedTitles,
        newStats: levelResult.stats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Undo quest completion
 */
const undoQuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found.'
      });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to modify another hero\'s quest.'
      });
    }

    if (!task.completed) {
      return res.status(400).json({
        success: false,
        message: 'Quest is not marked as completed.'
      });
    }

    task.completed = false;
    task.completedAt = null;
    if (task.questType === 'daily' && task.streak > 0) {
      task.streak -= 1;
    }
    if (task.questType === 'boss') {
      task.bossHp = task.bossMaxHp;
    }
    await task.save();

    const user = await User.findById(req.user._id);
    user.xp = Math.max(0, (user.xp || 0) - task.xpReward);
    user.gold = Math.max(0, (user.gold || 0) - task.goldReward);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Quest reopened.',
      quest: task,
      task,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a quest
 */
const deleteQuest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Quest not found.'
      });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to delete another hero\'s quest.'
      });
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Quest "${task.title}" dismissed from your log.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle a boss battle subtask
 */
const toggleBossSubtask = async (req, res, next) => {
  try {
    const { id, subtaskId } = req.params;
    const task = await Task.findById(id);

    if (!task || task.questType !== 'boss') {
      return res.status(404).json({ success: false, message: 'Boss quest not found.' });
    }

    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have authorization to strike another hero\'s boss raid.'
      });
    }

    const subtask = task.subTasks.id(subtaskId);
    if (!subtask) {
      return res.status(404).json({ success: false, message: 'Subtask not found in Boss Raid.' });
    }

    subtask.completed = !subtask.completed;
    subtask.completedAt = subtask.completed ? new Date() : null;

    const totalSubtasks = task.subTasks.length;
    const completedCount = task.subTasks.filter((st) => st.completed).length;
    const hpFraction = 1 - completedCount / totalSubtasks;
    task.bossHp = Math.max(0, Math.round(task.bossMaxHp * hpFraction));

    let levelUpData = null;
    let user = null;

    if (task.bossHp === 0 && !task.completed) {
      task.completed = true;
      task.completedAt = new Date();

      user = await User.findById(req.user._id);
      const difficultyConfig = DIFFICULTY_REWARDS[task.difficulty] || DIFFICULTY_REWARDS.medium;
      const statBonus = (difficultyConfig.statBonus || 1.0) * 1.5;

      const levelResult = processXpGain(
        user,
        task.xpReward,
        task.goldReward,
        task.category,
        statBonus,
        true
      );

      user.lastDailyCompletedDate = new Date();

      user.level = levelResult.newLevel;
      user.xp = levelResult.xp;
      user.maxXp = levelResult.maxXp;
      user.gold = levelResult.gold;
      user.stats = levelResult.stats;
      user.streak = levelResult.streak;
      user.longestStreak = levelResult.longestStreak;
      user.titles = levelResult.titles;
      await user.save();

      levelUpData = {
        leveledUp: levelResult.leveledUp,
        levelsGained: levelResult.levelsGained,
        newLevel: levelResult.newLevel,
        bonusGold: levelResult.totalBonusGold,
        newlyUnlockedTitles: levelResult.newlyUnlockedTitles,
        newStats: levelResult.stats
      };
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: task.completed
        ? `🔥 BOSS DEFEATED! ${task.bossName} has fallen!`
        : `Boss damaged! ${task.bossHp} / ${task.bossMaxHp} HP remaining.`,
      quest: task,
      task,
      user: user ? user.toSafeJSON() : req.user.toSafeJSON(),
      hero: user ? user.toSafeJSON() : req.user.toSafeJSON(),
      levelUpData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuests,
  getQuestById,
  createQuest,
  updateQuest,
  completeQuest,
  undoQuest,
  deleteQuest,
  toggleBossSubtask
};
