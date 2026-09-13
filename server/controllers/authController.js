const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const { CLASS_PROFILES, getXpRequiredForLevel } = require('../utils/rpgEngine');

const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Signup / Register new Hero
 */
const signup = async (req, res, next) => {
  try {
    const {
      username,
      email,
      password,
      heroClass = 'Warrior',
      avatar = 'warrior',
      equippedTheme = 'dark-fantasy'
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }]
    });

    if (existingUser) {
      const isEmail = existingUser.email === email.toLowerCase().trim();
      return res.status(409).json({
        success: false,
        message: isEmail
          ? 'A hero with that email is already inscribed in the Guild records.'
          : 'A hero with that username is already inscribed in the Guild records.'
      });
    }

    const classProfile = CLASS_PROFILES[heroClass] || CLASS_PROFILES.Warrior;

    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      level: 1,
      xp: 0,
      maxXp: getXpRequiredForLevel(1), // 100 * 1^1.5 = 100
      gold: 50,
      streak: 0,
      longestStreak: 0,
      stats: { ...classProfile.initialStats },
      equippedTheme: ['dark-fantasy', 'castle-theme', 'night-theme', 'classic-retro', 'emerald-forest', 'crimson-dungeon'].includes(equippedTheme)
        ? equippedTheme
        : 'dark-fantasy',
      heroClass,
      avatar,
      title: 'Novice Adventurer',
      titles: ['Novice Adventurer']
    });

    // 4 Starter quests covering all 4 core stats!
    const starterTasks = [
      {
        user: user._id,
        title: 'Complete 30 Pushups & Deep Stretching',
        category: 'Gym',
        questType: 'daily',
        difficulty: 'easy',
        attribute: 'strength',
        xpReward: 35,
        goldReward: 20,
        description: 'Physical exertion builds raw Strength attribute points.'
      },
      {
        user: user._id,
        title: 'Code for 30 Minutes on Core Project',
        category: 'Coding',
        questType: 'todo',
        difficulty: 'medium',
        attribute: 'intellect',
        xpReward: 75,
        goldReward: 45,
        description: 'Writing logic and algorithms sharpens your Intellect stat.'
      },
      {
        user: user._id,
        title: 'Study 15 Pages of Educational Reading',
        category: 'Study',
        questType: 'daily',
        difficulty: 'easy',
        attribute: 'discipline',
        xpReward: 35,
        goldReward: 20,
        description: 'Consistent focus and study fortifies your Discipline.'
      },
      {
        user: user._id,
        title: 'Sketch or Design a Creative Asset',
        category: 'Art',
        questType: 'todo',
        difficulty: 'trivial',
        attribute: 'creativity',
        xpReward: 15,
        goldReward: 10,
        description: 'Unleash imagination to enhance your Creativity stat.'
      }
    ];

    await Task.insertMany(starterTasks);

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: `Welcome to the Guild, ${user.username}!`,
      token,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login Hero
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Hero not found in Guild records.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid passcode for this Hero.'
      });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user: user.toSafeJSON(),
      hero: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hero logged out successfully.'
  });
};

const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeJSON(),
    hero: req.user.toSafeJSON()
  });
};

const updateTheme = async (req, res, next) => {
  try {
    const { theme } = req.body;
    const allowed = ['dark-fantasy', 'castle-theme', 'night-theme', 'classic-retro', 'emerald-forest', 'crimson-dungeon'];

    if (!allowed.includes(theme)) {
      return res.status(400).json({
        success: false,
        message: `Invalid theme. Choose from: ${allowed.join(', ')}`
      });
    }

    req.user.equippedTheme = theme;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: `Theme equipped: ${theme}`,
      equippedTheme: theme,
      user: req.user.toSafeJSON(),
      hero: req.user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, avatar, title, heroClass, equippedTheme } = req.body;
    const user = req.user;

    if (username) user.username = username.trim();
    if (avatar) user.avatar = avatar;
    if (equippedTheme) user.equippedTheme = equippedTheme;
    if (title) {
      user.title = title;
      if (!user.titles.includes(title)) {
        user.titles.push(title);
      }
    }
    if (heroClass && CLASS_PROFILES[heroClass]) {
      user.heroClass = heroClass;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated!',
      user: user.toSafeJSON(),
      hero: user.toSafeJSON()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  registerHero: signup,
  login,
  loginHero: login,
  logout,
  getMe,
  updateTheme,
  updateProfile
};
