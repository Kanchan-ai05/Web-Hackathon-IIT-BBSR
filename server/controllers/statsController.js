const Task = require('../models/Task');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

/**
 * Get hero campaign analytics and overview stats
 * Scoped strictly to authenticated user.
 */
const getHeroStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const completedTasks = await Task.find({ user: userId, completed: true });
    const pendingTasks = await Task.find({ user: userId, completed: false });
    const inventoryCount = await Inventory.countDocuments({ user: userId });

    // Breakdown by type
    const byType = {
      daily: completedTasks.filter((t) => t.questType === 'daily').length,
      todo: completedTasks.filter((t) => t.questType === 'todo').length,
      boss: completedTasks.filter((t) => t.questType === 'boss').length
    };

    // Breakdown by attribute (Coding->Intellect, Gym->Strength, Study->Discipline, Art->Creativity)
    const byAttribute = {
      strength: completedTasks.filter((t) => t.attribute === 'strength').length,
      intellect: completedTasks.filter((t) => t.attribute === 'intellect' || t.attribute === 'intelligence').length,
      discipline: completedTasks.filter((t) => t.attribute === 'discipline').length,
      creativity: completedTasks.filter((t) => t.attribute === 'creativity').length
    };

    const totalXpEarned = completedTasks.reduce((acc, t) => acc + (t.xpReward || 0), 0);
    const totalGoldEarned = completedTasks.reduce((acc, t) => acc + (t.goldReward || 0), 0);

    const totalAll = completedTasks.length + pendingTasks.length;
    const completionRate = totalAll > 0 ? Math.round((completedTasks.length / totalAll) * 100) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalCompleted: completedTasks.length,
        totalPending: pendingTasks.length,
        completionRate,
        byType,
        byAttribute,
        totalXpEarned,
        totalGoldEarned,
        currentStreak: req.user.streak || 0,
        inventoryCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Guild Hall Leaderboard
 */
const getGuildLeaderboard = async (req, res, next) => {
  try {
    const heroes = await User.find()
      .select('username heroClass level xp gold title avatar stats equippedTheme')
      .sort({ level: -1, gold: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      leaderboard: heroes
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHeroStats,
  getGuildLeaderboard
};
