const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Username must be at least 2 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    xp: {
      type: Number,
      default: 0,
      min: 0
    },
    maxXp: {
      type: Number,
      default: 100 // Level 1: 100 * 1^1.5 = 100
    },
    gold: {
      type: Number,
      default: 50,
      min: 0
    },
    streak: {
      type: Number,
      default: 0,
      min: 0
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    stats: {
      strength: { type: Number, default: 10 },    // Increased by Gym
      intellect: { type: Number, default: 10 },   // Increased by Coding
      discipline: { type: Number, default: 10 },  // Increased by Study
      creativity: { type: Number, default: 10 }   // Increased by Art
    },
    equippedTheme: {
      type: String,
      enum: ['dark-fantasy', 'castle-theme', 'night-theme', 'classic-retro', 'emerald-forest', 'crimson-dungeon'],
      default: 'dark-fantasy'
    },
    equippedGear: {
      weapon: { type: String, default: null }, // e.g. "Golden Sword"
      hat: { type: String, default: null },    // e.g. "Wizard Hat"
      pet: { type: String, default: null },    // e.g. "Crystal Pet"
      badge: { type: String, default: null }   // e.g. "Achievement Badges"
    },
    heroClass: {
      type: String,
      enum: ['Warrior', 'Mage', 'Rogue', 'Paladin'],
      default: 'Warrior'
    },
    avatar: {
      type: String,
      default: 'warrior'
    },
    title: {
      type: String,
      default: 'Novice Adventurer'
    },
    titles: {
      type: [String],
      default: ['Novice Adventurer']
    },
    lastDailyCompletedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

UserSchema.virtual('currentXp')
  .get(function () {
    return this.xp;
  })
  .set(function (val) {
    this.xp = val;
  });

// Pre-save hook to hash password with bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.toSafeJSON = function () {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
